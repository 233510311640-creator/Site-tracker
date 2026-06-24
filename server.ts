import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { JsonDb } from './src/db/jsonDb.js';
import { discoverIdeasWithSearchGrounding, generateDeepEvidenceAndRecommendations } from './src/lib/gemini.js';
import { mineRedditIdeas } from './src/lib/reddit.js';
import { generateDomainVariations, checkDomainAvailability } from './src/lib/domains.js';
import { trackCompetitorsForIdea } from './src/lib/competitors.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Background Scheduling State
let isBackgroundSyncing = false;
let lastSyncTime = new Date().toISOString();

// Start Background Refresh Loop (Wakes up every 24 hours, but we run once on startup too)
function startBackgroundCron() {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  
  const runSync = async () => {
    if (isBackgroundSyncing) return;
    console.log("[CRON] Starting autonomous background sync of Reddit mining and watchlist ideas...");
    isBackgroundSyncing = true;
    try {
      // 1. Mine Reddit
      const redditIdeas = await mineRedditIdeas();
      const currentIdeas = JsonDb.getIdeas();
      let newIdeasCount = 0;
      
      for (const idea of redditIdeas) {
        const exists = currentIdeas.some(i => i.name.toLowerCase() === idea.name.toLowerCase());
        if (!exists) {
          JsonDb.addIdea(idea);
          newIdeasCount++;
        }
      }
      console.log(`[CRON] Discovered and saved ${newIdeasCount} new micro-tool ideas from Reddit.`);

      // 2. Refresh watched domains
      const watchedIdeas = JsonDb.getIdeas().filter(i => i.is_watchlisted);
      const settings = JsonDb.getSettings();
      for (const idea of watchedIdeas) {
        const variations = generateDomainVariations(idea.name);
        for (const domain of variations) {
          const result = await checkDomainAvailability(domain, settings);
          JsonDb.addDomainCheck({
            idea_id: idea.id,
            domain_name: domain,
            is_available: result.is_available,
            registrar: result.registrar,
            creation_date: result.creation_date,
            status: result.status
          });
        }
      }
      console.log(`[CRON] Auto-checked domains for ${watchedIdeas.length} watchlisted ideas.`);
      
      lastSyncTime = new Date().toISOString();
      JsonDb.updateSyncTimes({ last_reddit_sync: lastSyncTime });
    } catch (err) {
      console.error("[CRON] Background sync failed:", err);
    } finally {
      isBackgroundSyncing = false;
    }
  };

  // Run on startup
  setTimeout(runSync, 10000); // 10s grace period after startup
  
  // Set interval
  setInterval(runSync, TWENTY_FOUR_HOURS);
}

// ------------------- API ROUTES -------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: "ok", 
    isBackgroundSyncing, 
    lastSyncTime 
  });
});

// Ideas Endpoints
app.get('/api/ideas', (req, res) => {
  try {
    const ideas = JsonDb.getIdeas();
    res.json({ success: true, data: ideas });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ideas/discover', async (req, res) => {
  const { query } = req.body;
  try {
    const newIdeas = await discoverIdeasWithSearchGrounding(query);
    const existingIdeas = JsonDb.getIdeas();
    const added: any[] = [];

    for (const idea of newIdeas) {
      const exists = existingIdeas.some(i => i.name.toLowerCase() === idea.name.toLowerCase());
      if (!exists) {
        const saved = JsonDb.addIdea(idea);
        added.push(saved);
      }
    }

    res.json({ success: true, message: `Discovered and added ${added.length} new ideas!`, added });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ideas/mine', async (req, res) => {
  try {
    const redditIdeas = await mineRedditIdeas();
    const existingIdeas = JsonDb.getIdeas();
    const added: any[] = [];

    for (const idea of redditIdeas) {
      const exists = existingIdeas.some(i => i.name.toLowerCase() === idea.name.toLowerCase());
      if (!exists) {
        const saved = JsonDb.addIdea(idea);
        added.push(saved);
      }
    }

    res.json({ success: true, message: `Reddit mining completed. Found and added ${added.length} new ideas!`, added });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ideas/watchlist', (req, res) => {
  const { id } = req.body;
  try {
    const isWatchlisted = JsonDb.toggleWatchlist(id);
    res.json({ success: true, is_watchlisted: isWatchlisted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/ideas/:id', (req, res) => {
  const { id } = req.params;
  try {
    const success = JsonDb.deleteIdea(Number(id));
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Domain Checker Endpoints
app.get('/api/domains', (req, res) => {
  const ideaId = req.query.ideaId ? Number(req.query.ideaId) : undefined;
  try {
    const checks = JsonDb.getDomains(ideaId);
    res.json({ success: true, data: checks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/domains/check', async (req, res) => {
  const { domain, ideaId } = req.body;
  try {
    const settings = JsonDb.getSettings();
    const result = await checkDomainAvailability(domain, settings);
    
    const saved = JsonDb.addDomainCheck({
      idea_id: ideaId ? Number(ideaId) : 0,
      domain_name: domain,
      is_available: result.is_available,
      registrar: result.registrar,
      creation_date: result.creation_date,
      status: result.status
    });

    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/domains/bulk-check', async (req, res) => {
  const { ideaId } = req.body;
  try {
    const idea = JsonDb.getIdeaById(Number(ideaId));
    if (!idea) {
      return res.status(404).json({ success: false, error: "Idea not found." });
    }

    const variations = generateDomainVariations(idea.name);
    const settings = JsonDb.getSettings();
    const checkedList = [];

    for (const domain of variations) {
      const result = await checkDomainAvailability(domain, settings);
      const saved = JsonDb.addDomainCheck({
        idea_id: idea.id,
        domain_name: domain,
        is_available: result.is_available,
        registrar: result.registrar,
        creation_date: result.creation_date,
        status: result.status
      });
      checkedList.push(saved);
    }

    res.json({ success: true, data: checkedList });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Competitors Endpoints
app.get('/api/competitors', (req, res) => {
  const ideaId = req.query.ideaId ? Number(req.query.ideaId) : undefined;
  try {
    const comps = JsonDb.getCompetitors(ideaId);
    res.json({ success: true, data: comps });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/competitors/refresh', async (req, res) => {
  const { ideaId } = req.body;
  try {
    const idea = JsonDb.getIdeaById(Number(ideaId));
    if (!idea) {
      return res.status(404).json({ success: false, error: "Idea not found." });
    }

    const settings = JsonDb.getSettings();
    const updatedComps = await trackCompetitorsForIdea(idea.id, idea.name, settings);
    res.json({ success: true, data: updatedComps });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Evidence Board Endpoints
app.get('/api/evidence', (req, res) => {
  const ideaId = req.query.ideaId ? Number(req.query.ideaId) : undefined;
  try {
    const evs = JsonDb.getEvidence(ideaId);
    res.json({ success: true, data: evs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/evidence/generate', async (req, res) => {
  const { ideaId } = req.body;
  try {
    const idea = JsonDb.getIdeaById(Number(ideaId));
    if (!idea) {
      return res.status(404).json({ success: false, error: "Idea not found." });
    }

    const generatedEvidence = await generateDeepEvidenceAndRecommendations(idea);
    const savedList = [];

    for (const ev of generatedEvidence) {
      const saved = JsonDb.addEvidence(ev);
      savedList.push(saved);
    }

    res.json({ success: true, data: savedList });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// My Sites / Portfolio Endpoints
app.get('/api/my-sites', (req, res) => {
  try {
    const sites = JsonDb.getMySites();
    res.json({ success: true, data: sites });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/my-sites', (req, res) => {
  const { domain, tool_name, launch_date, tech_stack, monetization, ga4_property, gsc_property, monthly_traffic, monthly_revenue, github_repo, status } = req.body;
  try {
    const newSite = JsonDb.addMySite({
      domain,
      tool_name,
      launch_date: launch_date || new Date().toISOString().split('T')[0],
      tech_stack: tech_stack || [],
      monetization: monetization || 'AdSense',
      ga4_property,
      gsc_property,
      monthly_traffic: Number(monthly_traffic) || 0,
      monthly_revenue: Number(monthly_revenue) || 0,
      github_repo,
      status: status || 'Under Development'
    });
    res.json({ success: true, data: newSite });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/my-sites/:id', (req, res) => {
  const { id } = req.params;
  try {
    const updated = JsonDb.updateMySite(Number(id), req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Portfolio site not found." });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/my-sites/:id', (req, res) => {
  const { id } = req.params;
  try {
    const success = JsonDb.deleteMySite(Number(id));
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Settings Endpoints
app.get('/api/settings', (req, res) => {
  try {
    const settings = JsonDb.getSettings();
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const settings = JsonDb.updateSettings(req.body);
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------- MAIN EXPRESS SERVER CONFIG -------------------

async function startServer() {
  // Start autonomous bg worker loops
  startBackgroundCron();

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Running at http://localhost:${PORT}`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
