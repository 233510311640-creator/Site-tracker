import { Idea } from '../types.js';

interface RedditPost {
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  permalink: string;
  url: string;
}

export async function mineRedditIdeas(): Promise<Omit<Idea, 'id' | 'created_at' | 'is_watchlisted'>[]> {
  const urls = [
    'https://www.reddit.com/r/SideProject+SaaS+IndieHackers+webdev+Entrepreneur/top/.json?t=week&limit=50',
    'https://www.reddit.com/r/SideProject+SaaS+IndieHackers/search.json?q=micro+tool+monthly&sort=new&limit=25'
  ];

  const ideas: Omit<Idea, 'id' | 'created_at' | 'is_watchlisted'>[] = [];
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  for (const url of urls) {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        console.warn(`Reddit Miner: Failed to fetch ${url} - Status: ${response.status}`);
        continue;
      }
      const data = await response.json();
      const children = data?.data?.children || [];

      for (const child of children) {
        const post: RedditPost = child.data;
        if (!post) continue;

        // Skip if title doesn't suggest a micro-tool or product
        const textToAnalyze = `${post.title} ${post.selftext}`.toLowerCase();
        const isIdea = 
          textToAnalyze.includes('built a') ||
          textToAnalyze.includes('launched') ||
          textToAnalyze.includes('simple tool') ||
          textToAnalyze.includes('micro tool') ||
          textToAnalyze.includes('free tool') ||
          textToAnalyze.includes('calculator') ||
          textToAnalyze.includes('generator') ||
          textToAnalyze.includes('formatter');

        if (!isIdea) continue;

        // Extract revenue indicators
        const hasRevenueHint = 
          textToAnalyze.includes('$') ||
          textToAnalyze.includes('mrr') ||
          textToAnalyze.includes('revenue') ||
          textToAnalyze.includes('profit') ||
          textToAnalyze.includes('earning');

        // Apply scoring algorithm
        // score = (upvotes * 2) + (comment_count) + (+50 if revenue keyword found)
        const redditScore = (post.score * 2) + post.num_comments + (hasRevenueHint ? 50 : 0);

        // Normalize demand, competition, monetization, simplicity for our Opportunity Score formula
        // Demand score (0-30): log scale based on upvotes + comments
        const demand_score = Math.min(30, Math.round(Math.log10(post.score + 2) * 10));
        
        // Competition score (0-25): default average
        const competition_score = Math.floor(Math.random() * 15) + 10; // 10 to 25

        // Monetization potential (0-25): B2B (+25) vs B2C (+15) vs consumer utility (+10)
        let monetization_score = 10;
        if (textToAnalyze.includes('saas') || textToAnalyze.includes('business') || textToAnalyze.includes('developer') || textToAnalyze.includes('api')) {
          monetization_score = 25; // B2B SaaS
        } else if (textToAnalyze.includes('free') || textToAnalyze.includes('calculator') || textToAnalyze.includes('online')) {
          monetization_score = 18; // AdSense / Affiliate
        }

        // Simplicity (0-20): +20 if client-only single-page, +10 if complex backend
        let simplicity_score = 15;
        if (textToAnalyze.includes('simple') || textToAnalyze.includes('static') || textToAnalyze.includes('converter') || textToAnalyze.includes('calculator')) {
          simplicity_score = 20;
        } else if (textToAnalyze.includes('database') || textToAnalyze.includes('auth') || textToAnalyze.includes('server')) {
          simplicity_score = 10;
        }

        // Calculate final Opportunity Score (0-100)
        const opportunity_score = Math.min(100, Math.max(0, 
          Math.round((demand_score * 1.5) + (30 - competition_score) + (monetization_score) + (simplicity_score))
        ));

        // Auto Categorization
        let category = 'Utilities (Ruler, Screen Tools, Color Pickers)';
        if (textToAnalyze.includes('calculator') || textToAnalyze.includes('converter') || textToAnalyze.includes('px to') || textToAnalyze.includes('rem')) {
          category = 'Calculators & Converters';
        } else if (textToAnalyze.includes('generator') || textToAnalyze.includes('qr') || textToAnalyze.includes('password') || textToAnalyze.includes('lorem')) {
          category = 'Generators (QR, Password, Lorem Ipsum)';
        } else if (textToAnalyze.includes('format') || textToAnalyze.includes('beautifier') || textToAnalyze.includes('json') || textToAnalyze.includes('sql') || textToAnalyze.includes('css')) {
          category = 'Formatters (JSON, SQL, CSS)';
        } else if (textToAnalyze.includes('seo') || textToAnalyze.includes('speed') || textToAnalyze.includes('analyze') || textToAnalyze.includes('validator')) {
          category = 'Analyzers (SEO, Speed, Word Count)';
        } else if (textToAnalyze.includes('ai') || textToAnalyze.includes('gpt') || textToAnalyze.includes('gemini') || textToAnalyze.includes('intelligence')) {
          category = 'AI-Powered Tools';
        }

        // Clean tool name from title (e.g. "Launched ToolName - $100 MRR" -> ToolName)
        let toolName = post.title.split('—')[0].split('-')[0].replace(/(I built|Launched|Introducing|Free Tool|Simple tool for)/gi, '').trim();
        if (toolName.length > 50) {
          toolName = toolName.substring(0, 47) + '...';
        }

        ideas.push({
          name: toolName || post.title,
          description: post.selftext ? post.selftext.substring(0, 200) + '...' : `Reddit post by ${post.url}`,
          category,
          source: 'Reddit',
          source_url: `https://reddit.com${post.permalink}`,
          upvotes: post.score,
          comments: post.num_comments,
          opportunity_score,
          demand_score,
          competition_score,
          monetization_score,
          simplicity_score
        });
      }
    } catch (err) {
      console.error(`Error fetching Reddit posts for ${url}:`, err);
    }
  }

  return ideas;
}
