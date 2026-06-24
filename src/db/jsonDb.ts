import fs from 'fs';
import path from 'path';
import { Idea, DomainCheck, Competitor, MySite, Evidence, Settings } from '../types.js';

const DB_FILE = path.join(process.cwd(), 'db.json');

interface DbSchema {
  ideas: Idea[];
  domains: DomainCheck[];
  competitors: Competitor[];
  my_sites: MySite[];
  evidence: Evidence[];
  settings: Settings;
  last_reddit_sync?: string;
  last_producthunt_sync?: string;
}

const DEFAULT_SETTINGS: Settings = {
  gemini_api_key: process.env.GEMINI_API_KEY || '',
  whoisjson_api_key: '',
  whoisxml_api_key: '',
  ninjas_api_key: '',
  serpapi_api_key: '',
  semrush_api_key: ''
};

// High-quality pre-seeded ideas for a polished launch
const SEED_IDEAS: Idea[] = [
  {
    id: 1,
    name: "SVG Waves & Morphing Generator",
    description: "Generate smooth organic SVG wave shapes and morphing paths for web backgrounds and transitions, with exportable SVG code and Tailwind integration.",
    category: "Generators (QR, Password, Lorem Ipsum)",
    source: "Reddit (r/SideProject)",
    source_url: "https://reddit.com/r/SideProject/comments/example1",
    upvotes: 142,
    comments: 32,
    opportunity_score: 84,
    demand_score: 80,
    competition_score: 15, // Low competition
    monetization_score: 75, // AdSense + Pro templates
    simplicity_score: 90, // Single page, client-side math
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    is_watchlisted: true
  },
  {
    id: 2,
    name: "Tailwind CSS Palette & Contrast Analyzer",
    description: "A tool to create and tweak custom Tailwind CSS color palettes, validating WCAG 2.1 accessibility and generating ready-to-use theme extensions.",
    category: "Utilities (Ruler, Screen Tools, Color Pickers)",
    source: "Product Hunt",
    source_url: "https://producthunt.com/posts/example2",
    upvotes: 210,
    comments: 45,
    opportunity_score: 79,
    demand_score: 82,
    competition_score: 30,
    monetization_score: 65,
    simplicity_score: 85,
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    is_watchlisted: true
  },
  {
    id: 3,
    name: "RegEx Semantic Explainer & Builder",
    description: "Build, test, and debug regular expressions using simple natural language prompts, complete with dynamic visual group highlighting and cheat sheets.",
    category: "AI-Powered Tools",
    source: "Reddit (r/SaaS)",
    source_url: "https://reddit.com/r/SaaS/comments/example3",
    upvotes: 89,
    comments: 18,
    opportunity_score: 81,
    demand_score: 75,
    competition_score: 25,
    monetization_score: 80,
    simplicity_score: 75,
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    is_watchlisted: false
  },
  {
    id: 4,
    name: "JSON-LD Rich Snippet Schema Validator",
    description: "An offline-first visual playground to construct valid JSON-LD schema snippets for Google Rich Search Results, including articles, products, and FAQs.",
    category: "Formatters (JSON, SQL, CSS)",
    source: "IndieHackers",
    source_url: "https://indiehackers.com/product/schema-gen",
    upvotes: 64,
    comments: 11,
    opportunity_score: 72,
    demand_score: 68,
    competition_score: 20,
    monetization_score: 70,
    simplicity_score: 80,
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    is_watchlisted: false
  },
  {
    id: 5,
    name: "SaaS Break-Even & LTV Calculator",
    description: "A gorgeous, interactive visualizer calculator for bootstrapped founders to plan pricing, model customer churn, and calculate break-even timelines.",
    category: "Calculators & Converters",
    source: "Reddit (r/IndieHackers)",
    source_url: "https://reddit.com/r/IndieHackers/comments/example5",
    upvotes: 115,
    comments: 29,
    opportunity_score: 88,
    demand_score: 85,
    competition_score: 10,
    monetization_score: 80,
    simplicity_score: 95,
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    is_watchlisted: true
  }
];

const SEED_DOMAINS: DomainCheck[] = [
  {
    id: 1,
    idea_id: 1,
    domain_name: "svgwaves.com",
    is_available: false,
    registrar: "Namecheap, Inc.",
    creation_date: "2018-04-12T10:00:00Z",
    checked_at: new Date().toISOString(),
    status: "Taken"
  },
  {
    id: 2,
    idea_id: 1,
    domain_name: "getsvgwaves.com",
    is_available: true,
    checked_at: new Date().toISOString(),
    status: "Available"
  },
  {
    id: 3,
    idea_id: 1,
    domain_name: "svgwavegenerator.com",
    is_available: true,
    checked_at: new Date().toISOString(),
    status: "Available"
  },
  {
    id: 4,
    idea_id: 2,
    domain_name: "tailwindpalette.com",
    is_available: false,
    registrar: "GoDaddy.com, LLC",
    creation_date: "2021-02-15T15:20:00Z",
    checked_at: new Date().toISOString(),
    status: "Taken"
  },
  {
    id: 5,
    idea_id: 2,
    domain_name: "tailwindpalettetool.com",
    is_available: true,
    checked_at: new Date().toISOString(),
    status: "Available"
  }
];

const SEED_COMPETITORS: Competitor[] = [
  {
    id: 1,
    idea_id: 1,
    domain: "getwaves.io",
    monthly_visits: 125000,
    global_rank: 245000,
    bounce_rate: 42.5,
    top_country: "United States",
    traffic_trend: "steady",
    threat_level: "High",
    last_checked: new Date().toISOString(),
    estimated_revenue: 250,
    tech_stack: ["Next.js", "Tailwind CSS", "Vercel"],
    top_keywords: ["svg waves generator", "css waves", "generate curve path"]
  },
  {
    id: 2,
    idea_id: 1,
    domain: "shapedivider.app",
    monthly_visits: 85000,
    global_rank: 350000,
    bounce_rate: 46.8,
    top_country: "Germany",
    traffic_trend: "up",
    threat_level: "Medium",
    last_checked: new Date().toISOString(),
    estimated_revenue: 170,
    tech_stack: ["Gatsby", "Styled Components", "Netlify"],
    top_keywords: ["svg wave divider", "shape divider", "curved web footer"]
  },
  {
    id: 3,
    idea_id: 2,
    domain: "coolors.co",
    monthly_visits: 3400000,
    global_rank: 15400,
    bounce_rate: 35.2,
    top_country: "United States",
    traffic_trend: "up",
    threat_level: "High",
    last_checked: new Date().toISOString(),
    estimated_revenue: 6800,
    tech_stack: ["React", "Express", "Node.js", "AdSense"],
    top_keywords: ["color picker", "color palette generator", "tailwind colors"]
  }
];

const SEED_MY_SITES: MySite[] = [
  {
    id: 1,
    domain: "easyregexexplainer.com",
    tool_name: "RegEx Semantic Explainer",
    launch_date: "2026-05-10",
    tech_stack: ["Vite", "React", "Tailwind CSS"],
    monetization: "AdSense + Carbon Ads",
    monthly_traffic: 4500,
    monthly_revenue: 35,
    github_repo: "github.com/myusername/easy-regex-explainer",
    status: "Active"
  },
  {
    id: 2,
    domain: "saasbreakeven.com",
    tool_name: "SaaS Break-Even Calculator",
    launch_date: "2026-06-20",
    tech_stack: ["Next.js", "Zustand", "Tailwind CSS"],
    monetization: "AdSense + Newsletter Sponsorship",
    monthly_traffic: 450,
    monthly_revenue: 0,
    github_repo: "github.com/myusername/saas-breakeven",
    status: "Under Development"
  }
];

const SEED_EVIDENCE: Evidence[] = [
  {
    id: 1,
    idea_id: 1,
    evidence_type: "market",
    content: "3,500 monthly searches for 'svg waves creator' on Google with +45% YoY trend growth. 142 upvotes on Reddit SideProject indicate high developer interest.",
    confidence_score: 88,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    idea_id: 1,
    evidence_type: "financial",
    content: "Minimal operational cost (purely static file hosting). Estimated monetization at 120k visits/mo yields $250 - $400/mo via AdSense and newsletter slots.",
    confidence_score: 82,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    idea_id: 1,
    evidence_type: "competitive",
    content: "Major competitors shapedivider.app and getwaves.io lack modern presets (e.g. noise overlays, grain gradients) and have aggressive cookie-consent walls that degrade UX.",
    confidence_score: 90,
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    idea_id: 1,
    evidence_type: "recommendation",
    content: "Build a single-page SVG Wave & Morphing path custom designer with a focus on 'Gradients and Grain overlays'. Differentiate by allowing users to copy direct Tailwind CSS wave component classes, completely removing any signup requirements to capture SEO backlinks fast.",
    confidence_score: 95,
    created_at: new Date().toISOString()
  }
];

export class JsonDb {
  private static data: DbSchema | null = null;

  private static load() {
    if (this.data) return;

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error("Error reading db.json, resetting to defaults", err);
      }
    }

    if (!this.data) {
      this.data = {
        ideas: SEED_IDEAS,
        domains: SEED_DOMAINS,
        competitors: SEED_COMPETITORS,
        my_sites: SEED_MY_SITES,
        evidence: SEED_EVIDENCE,
        settings: DEFAULT_SETTINGS,
        last_reddit_sync: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        last_producthunt_sync: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      };
      this.save();
    }
  }

  private static save() {
    if (!this.data) return;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error("Failed to write to db.json", err);
    }
  }

  // Ideas
  static getIdeas(): Idea[] {
    this.load();
    return this.data!.ideas;
  }

  static getIdeaById(id: number): Idea | undefined {
    this.load();
    return this.data!.ideas.find(i => i.id === id);
  }

  static addIdea(idea: Omit<Idea, 'id' | 'created_at' | 'is_watchlisted'>): Idea {
    this.load();
    const nextId = this.data!.ideas.reduce((max, item) => item.id > max ? item.id : max, 0) + 1;
    const newIdea: Idea = {
      ...idea,
      id: nextId,
      created_at: new Date().toISOString(),
      is_watchlisted: false
    };
    this.data!.ideas.push(newIdea);
    this.save();
    return newIdea;
  }

  static updateIdea(id: number, updates: Partial<Idea>): Idea | undefined {
    this.load();
    const index = this.data!.ideas.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    this.data!.ideas[index] = { ...this.data!.ideas[index], ...updates };
    this.save();
    return this.data!.ideas[index];
  }

  static toggleWatchlist(id: number): boolean {
    this.load();
    const index = this.data!.ideas.findIndex(i => i.id === id);
    if (index === -1) return false;
    this.data!.ideas[index].is_watchlisted = !this.data!.ideas[index].is_watchlisted;
    this.save();
    return this.data!.ideas[index].is_watchlisted;
  }

  static deleteIdea(id: number): boolean {
    this.load();
    const len = this.data!.ideas.length;
    this.data!.ideas = this.data!.ideas.filter(i => i.id !== id);
    this.data!.domains = this.data!.domains.filter(d => d.idea_id !== id);
    this.data!.competitors = this.data!.competitors.filter(c => c.idea_id !== id);
    this.data!.evidence = this.data!.evidence.filter(e => e.idea_id !== id);
    this.save();
    return this.data!.ideas.length < len;
  }

  // Domains
  static getDomains(ideaId?: number): DomainCheck[] {
    this.load();
    if (ideaId !== undefined) {
      return this.data!.domains.filter(d => d.idea_id === ideaId);
    }
    return this.data!.domains;
  }

  static addDomainCheck(check: Omit<DomainCheck, 'id' | 'checked_at'>): DomainCheck {
    this.load();
    const nextId = this.data!.domains.reduce((max, item) => item.id > max ? item.id : max, 0) + 1;
    const newCheck: DomainCheck = {
      ...check,
      id: nextId,
      checked_at: new Date().toISOString()
    };
    // Avoid duplicates for the same idea and domain name
    this.data!.domains = this.data!.domains.filter(d => !(d.idea_id === check.idea_id && d.domain_name.toLowerCase() === check.domain_name.toLowerCase()));
    this.data!.domains.push(newCheck);
    this.save();
    return newCheck;
  }

  // Competitors
  static getCompetitors(ideaId?: number): Competitor[] {
    this.load();
    if (ideaId !== undefined) {
      return this.data!.competitors.filter(c => c.idea_id === ideaId);
    }
    return this.data!.competitors;
  }

  static addCompetitor(comp: Omit<Competitor, 'id' | 'last_checked'>): Competitor {
    this.load();
    const nextId = this.data!.competitors.reduce((max, item) => item.id > max ? item.id : max, 0) + 1;
    const newComp: Competitor = {
      ...comp,
      id: nextId,
      last_checked: new Date().toISOString()
    };
    // Avoid exact duplicates
    this.data!.competitors = this.data!.competitors.filter(c => !(c.idea_id === comp.idea_id && c.domain.toLowerCase() === comp.domain.toLowerCase()));
    this.data!.competitors.push(newComp);
    this.save();
    return newComp;
  }

  // My Sites / Portfolio
  static getMySites(): MySite[] {
    this.load();
    return this.data!.my_sites;
  }

  static addMySite(site: Omit<MySite, 'id'>): MySite {
    this.load();
    const nextId = this.data!.my_sites.reduce((max, item) => item.id > max ? item.id : max, 0) + 1;
    const newSite: MySite = { ...site, id: nextId };
    this.data!.my_sites.push(newSite);
    this.save();
    return newSite;
  }

  static updateMySite(id: number, updates: Partial<MySite>): MySite | undefined {
    this.load();
    const index = this.data!.my_sites.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    this.data!.my_sites[index] = { ...this.data!.my_sites[index], ...updates };
    this.save();
    return this.data!.my_sites[index];
  }

  static deleteMySite(id: number): boolean {
    this.load();
    const len = this.data!.my_sites.length;
    this.data!.my_sites = this.data!.my_sites.filter(s => s.id !== id);
    this.save();
    return this.data!.my_sites.length < len;
  }

  // Evidence
  static getEvidence(ideaId?: number): Evidence[] {
    this.load();
    if (ideaId !== undefined) {
      return this.data!.evidence.filter(e => e.idea_id === ideaId);
    }
    return this.data!.evidence;
  }

  static addEvidence(ev: Omit<Evidence, 'id' | 'created_at'>): Evidence {
    this.load();
    const nextId = this.data!.evidence.reduce((max, item) => item.id > max ? item.id : max, 0) + 1;
    const newEv: Evidence = {
      ...ev,
      id: nextId,
      created_at: new Date().toISOString()
    };
    // Remove previous evidence of this type for this idea
    this.data!.evidence = this.data!.evidence.filter(e => !(e.idea_id === ev.idea_id && e.evidence_type === ev.evidence_type));
    this.data!.evidence.push(newEv);
    this.save();
    return newEv;
  }

  // Settings
  static getSettings(): Settings {
    this.load();
    return this.data!.settings;
  }

  static updateSettings(settings: Partial<Settings>): Settings {
    this.load();
    this.data!.settings = { ...this.data!.settings, ...settings };
    this.save();
    return this.data!.settings;
  }

  // Sync Times
  static getSyncTimes() {
    this.load();
    return {
      last_reddit_sync: this.data!.last_reddit_sync,
      last_producthunt_sync: this.data!.last_producthunt_sync
    };
  }

  static updateSyncTimes(times: { last_reddit_sync?: string, last_producthunt_sync?: string }) {
    this.load();
    if (times.last_reddit_sync) this.data!.last_reddit_sync = times.last_reddit_sync;
    if (times.last_producthunt_sync) this.data!.last_producthunt_sync = times.last_producthunt_sync;
    this.save();
  }
}
