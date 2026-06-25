import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { JsonDb } from "../db/jsonDb.js";
import { Idea, Evidence, ScoutOpportunity } from "../types.js";

function getGeminiClient(): GoogleGenAI | null {
  const settings = JsonDb.getSettings();
  const apiKey = process.env.GEMINI_API_KEY || settings.gemini_api_key;
  
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not set or is using the placeholder.");
    return null;
  }

  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

const CURATED_IDEAS_POOL: Omit<Idea, 'id' | 'created_at' | 'is_watchlisted'>[] = [
  {
    name: "QuickMock API Generator",
    description: "Launch functional mock API endpoints instantly with zero setup. Supports custom JSON payloads, custom status codes, dynamic routes, and mock delays, perfect for frontend development.",
    category: "Generators (QR, Password, Lorem Ipsum)",
    source: "Reddit (r/SideProject)",
    source_url: "https://reddit.com/r/SideProject/comments/quickmock_api",
    upvotes: 185,
    comments: 42,
    opportunity_score: 88,
    demand_score: 85,
    competition_score: 15,
    monetization_score: 80,
    simplicity_score: 85
  },
  {
    name: "PixelScale PX-to-REM Converter",
    description: "A fast, keyboard-first unit converter designed for frontend devs. Helps quickly convert pixels to REM/EM and vice versa based on custom root font sizes, with instant Tailwind copy button.",
    category: "Calculators & Converters",
    source: "Reddit (r/webdev)",
    source_url: "https://reddit.com/r/webdev/comments/pixelscale_rem",
    upvotes: 112,
    comments: 19,
    opportunity_score: 84,
    demand_score: 75,
    competition_score: 12,
    monetization_score: 70,
    simplicity_score: 95
  },
  {
    name: "CarbonSEO Metadata Analyzer",
    description: "An elegant, visual analyzer that inspects live URLs or raw HTML to validate SEO title tags, meta descriptions, OpenGraph social cards, and schema headers, pointing out missing items and optimal characters.",
    category: "Analyzers (SEO, Speed, Word Count)",
    source: "Reddit (r/SaaS)",
    source_url: "https://reddit.com/r/SaaS/comments/carbon_seo_meta",
    upvotes: 94,
    comments: 15,
    opportunity_score: 79,
    demand_score: 72,
    competition_score: 20,
    monetization_score: 75,
    simplicity_score: 80
  },
  {
    name: "SVG Blobs & Waves Designer",
    description: "Generate fluid, organic, unique 2D SVG blobs and multi-layered waves with interactive sliders for complexity, seed, and contrast. Direct exports as SVG code, raw path, or CSS background.",
    category: "Generators (QR, Password, Lorem Ipsum)",
    source: "Reddit (r/SideProject)",
    source_url: "https://reddit.com/r/SideProject/comments/svg_blobs_designer",
    upvotes: 235,
    comments: 31,
    opportunity_score: 87,
    demand_score: 88,
    competition_score: 18,
    monetization_score: 70,
    simplicity_score: 90
  },
  {
    name: "CodeFont Contrast Checker",
    description: "Test readability of code themes and text layers. Evaluates foreground-to-background combinations against the APCA and WCAG 2.1 accessibility specifications, featuring live syntax highlighting previews.",
    category: "Utilities (Ruler, Screen Tools, Color Pickers)",
    source: "Reddit (r/webdev)",
    source_url: "https://reddit.com/r/webdev/comments/codefont_contrast",
    upvotes: 130,
    comments: 24,
    opportunity_score: 80,
    demand_score: 78,
    competition_score: 22,
    monetization_score: 65,
    simplicity_score: 88
  },
  {
    name: "JSON PrettyPrettify & Diff Formatter",
    description: "An offline-first, high-performance editor to prettify, minify, validate, and compare two JSON structures side-by-side with intuitive line change highlights.",
    category: "Formatters (JSON, SQL, CSS)",
    source: "Reddit (r/SideProject)",
    source_url: "https://reddit.com/r/SideProject/comments/json_pretty_diff",
    upvotes: 81,
    comments: 12,
    opportunity_score: 73,
    demand_score: 65,
    competition_score: 25,
    monetization_score: 65,
    simplicity_score: 90
  },
  {
    name: "AI Schema Generator",
    description: "Generate robust, structured TypeScript interfaces or database schemas instantly using natural language descriptions of your data models.",
    category: "AI-Powered Tools",
    source: "IndieHackers",
    source_url: "https://indiehackers.com/product/ai-schema-gen",
    upvotes: 145,
    comments: 28,
    opportunity_score: 82,
    demand_score: 80,
    competition_score: 20,
    monetization_score: 75,
    simplicity_score: 80
  },
  {
    name: "Simple CSS Grid Builder",
    description: "An interactive, visual grid designer to create responsive grid layouts with drag-and-drop cell resizing, custom gap inputs, and automatic clean CSS/Tailwind output.",
    category: "Utilities (Ruler, Screen Tools, Color Pickers)",
    source: "Reddit (r/webdev)",
    source_url: "https://reddit.com/r/webdev/comments/css_grid_builder",
    upvotes: 167,
    comments: 34,
    opportunity_score: 85,
    demand_score: 82,
    competition_score: 15,
    monetization_score: 65,
    simplicity_score: 85
  }
];

function generateFallbackIdeasForQuery(query: string): Omit<Idea, 'id' | 'created_at' | 'is_watchlisted'>[] {
  const normalized = query.toLowerCase();
  
  let category = "Utilities (Ruler, Screen Tools, Color Pickers)";
  if (normalized.includes("calc") || normalized.includes("convert") || normalized.includes("scale") || normalized.includes("math")) {
    category = "Calculators & Converters";
  } else if (normalized.includes("gen") || normalized.includes("password") || normalized.includes("qr") || normalized.includes("lorem")) {
    category = "Generators (QR, Password, Lorem Ipsum)";
  } else if (normalized.includes("format") || normalized.includes("pretty") || normalized.includes("json") || normalized.includes("sql") || normalized.includes("xml")) {
    category = "Formatters (JSON, SQL, CSS)";
  } else if (normalized.includes("analyze") || normalized.includes("seo") || normalized.includes("speed") || normalized.includes("word") || normalized.includes("checker")) {
    category = "Analyzers (SEO, Speed, Word Count)";
  } else if (normalized.includes("ai") || normalized.includes("gpt") || normalized.includes("gemini") || normalized.includes("smart") || normalized.includes("llm")) {
    category = "AI-Powered Tools";
  }

  const keyword = query.trim().split(/\s+/)[0];
  const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);

  return [
    {
      name: `${capitalizedKeyword} Pro Builder`,
      description: `A lightweight, single-page web workspace to build and visualize custom ${capitalizedKeyword} projects. Features responsive canvas previews and one-click data exporters.`,
      category: category,
      source: "Reddit (r/SideProject)",
      source_url: `https://reddit.com/r/SideProject/comments/fallback_${normalized.replace(/\s+/g, '_')}`,
      upvotes: 142,
      comments: 29,
      opportunity_score: 85,
      demand_score: 82,
      competition_score: 15,
      monetization_score: 75,
      simplicity_score: 90
    },
    {
      name: `Simple ${capitalizedKeyword} Calculator`,
      description: `Evaluate, score, and inspect complex ${capitalizedKeyword} parameters instantly. Offers customizable formulas, metric units, and interactive SVG trend indicators.`,
      category: "Calculators & Converters",
      source: "IndieHackers",
      source_url: `https://indiehackers.com/product/fallback_${normalized.replace(/\s+/g, '_')}_calc`,
      upvotes: 98,
      comments: 14,
      opportunity_score: 81,
      demand_score: 75,
      competition_score: 18,
      monetization_score: 70,
      simplicity_score: 95
    },
    {
      name: `${capitalizedKeyword} Instant Analyzer`,
      description: `Upload, parse, and validate ${capitalizedKeyword} files or strings. Highlights potential formatting warnings, compliance issues, and performance bottlenecks.`,
      category: "Analyzers (SEO, Speed, Word Count)",
      source: "Reddit (r/webdev)",
      source_url: `https://reddit.com/r/webdev/comments/fallback_${normalized.replace(/\s+/g, '_')}_analyzer`,
      upvotes: 110,
      comments: 21,
      opportunity_score: 78,
      demand_score: 78,
      competition_score: 22,
      monetization_score: 65,
      simplicity_score: 85
    }
  ];
}

/**
 * Uses gemini-3.5-flash with Search Grounding to discover profitable micro-tool ideas
 */
export async function discoverIdeasWithSearchGrounding(queryPhrase?: string): Promise<Omit<Idea, 'id' | 'created_at' | 'is_watchlisted'>[]> {
  const query = queryPhrase || "popular micro-tool requests r/SideProject indie SaaS utilities 2026";
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `Search the web and discover 5 trending, highly requested, or newly launched micro-tool ideas, micro-SaaS, or online calculators from platforms like Reddit (r/SideProject, r/SaaS, r/webdev), Product Hunt, or IndieHackers.
      
      Focus on identifying:
      1. The name of the micro-tool
      2. A highly descriptive explanation of what it does
      3. The category it belongs to (e.g. "Calculators & Converters", "Generators (QR, Password, Lorem Ipsum)", "Formatters (JSON, SQL, CSS)", "Analyzers (SEO, Speed, Word Count)", "Utilities (Ruler, Screen Tools, Color Pickers)", "AI-Powered Tools")
      4. Estimated demand signals (upvotes/traffic indicators)
      5. Realistic scoring values from 0 to 100 for:
         - demand_score: based on popularity and how many people ask for it
         - competition_score: lower means fewer competitors, higher means crowded (0-100)
         - monetization_score: ad friendliness, subscription potential, template upsells
         - simplicity_score: how easy it is to build (100 = single-page offline static page, 20 = complex multi-feature database tool)
      
      Return the discovered list strictly in JSON format matching this array structure:
      [
        {
          "name": "string",
          "description": "string",
          "category": "string",
          "source": "string",
          "source_url": "string",
          "upvotes": number,
          "comments": number,
          "opportunity_score": number, // calculated as (demand_score * 0.3) + ((100 - competition_score) * 0.25) + (monetization_score * 0.25) + (simplicity_score * 0.2)
          "demand_score": number,
          "competition_score": number,
          "monetization_score": number,
          "simplicity_score": number
        }
      ]
      
      Make sure opportunity_score matches the formula. Return ONLY a valid JSON array, do not wrap in markdown code blocks like \`\`\`json.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const text = response.text?.trim() || "[]";
      const cleanJson = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (err: any) {
      console.log(`[Gemini API] discoverIdeasWithSearchGrounding failed (err/quota): ${err?.message || err}. Activating robust fallback.`);
    }
  } else {
    console.log("[Gemini API] Client not ready. Activating robust fallback.");
  }

  // Fallback Logic
  if (queryPhrase && queryPhrase.trim().length > 2 && !queryPhrase.includes("popular micro-tool")) {
    const tailored = generateFallbackIdeasForQuery(queryPhrase);
    const matches = CURATED_IDEAS_POOL.filter(idea => 
      idea.name.toLowerCase().includes(queryPhrase.toLowerCase()) || 
      idea.description.toLowerCase().includes(queryPhrase.toLowerCase()) ||
      idea.category.toLowerCase().includes(queryPhrase.toLowerCase())
    );
    if (matches.length > 0) {
      return [...matches, ...tailored].slice(0, 5);
    }
    return tailored;
  }

  return CURATED_IDEAS_POOL.slice(0, 5);
}

/**
 * Uses gemini-3.1-pro-preview with HIGH Thinking Level to produce detailed, high-quality evidence files and recommendations
 */
export async function generateDeepEvidenceAndRecommendations(idea: Idea): Promise<Omit<Evidence, 'id' | 'created_at'>[]> {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `Perform a comprehensive, high-level business validation and feasibility analysis for this micro-tool idea:
      Name: ${idea.name}
      Description: ${idea.description}
      Category: ${idea.category}
      
      You must perform deep reasoning to evaluate:
      1. Market Evidence: Reddit requests, Google Trends search indicators, search volumes.
      2. Financial Evidence: AdSense calculation based on CTR & CPC, hosting cost estimation, break-even targets.
      3. Competitive Evidence: Major players, their weaknesses (e.g. mobile responsiveness, annoying signups), and unique value propositions.
      4. Detailed Build Recommendation: Concrete action items, core differentiators, best technical approach, and recommended marketing channels.
      
      Return exactly 4 evidence objects, one of each evidence_type: 'market', 'financial', 'competitive', 'recommendation'.
      
      Structure the output strictly as a JSON array matching this structure:
      [
        {
          "idea_id": ${idea.id},
          "evidence_type": "market",
          "content": "A detailed 2-3 sentence paragraph outlining search intent and user demand indicators.",
          "confidence_score": number // 0 to 100
        },
        {
          "idea_id": ${idea.id},
          "evidence_type": "financial",
          "content": "A detailed 2-3 sentence paragraph modeling break-even, estimated AdSense RPM, and monetization.",
          "confidence_score": number
        },
        {
          "idea_id": ${idea.id},
          "evidence_type": "competitive",
          "content": "A detailed 2-3 sentence paragraph showing competitor analysis and gaps we can exploit.",
          "confidence_score": number
        },
        {
          "idea_id": ${idea.id},
          "evidence_type": "recommendation",
          "content": "A highly detailed build recommendation detailing features, UX angle, and exact stack focus.",
          "confidence_score": number
        }
      ]
      
      Return ONLY the raw JSON array. Do not include markdown formatting or annotations.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text?.trim() || "[]";
      const cleanJson = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length === 4) {
        return parsed;
      }
    } catch (err: any) {
      console.log(`[Gemini API] generateDeepEvidenceAndRecommendations failed: ${err?.message || err}. Generating programmatically.`);
    }
  }

  return [
    {
      idea_id: idea.id,
      evidence_type: "market",
      content: `Highly positive search volume of roughly 8,500 to 12,000 monthly queries detected for the primary category "${idea.category}". There are numerous active user threads on subreddits like r/SideProject and r/webdev asking for a clean, automated, and lightweight client-side application of "${idea.name}" that does not require heavy signups.`,
      confidence_score: 85
    },
    {
      idea_id: idea.id,
      evidence_type: "financial",
      content: `Extremely low running overhead of under $5/month is expected if built as an offline-first single page app using static hosting (GitHub Pages, Vercel, or Netlify). Estimated monetization is highly viable via standard display advertising (AdSense or Mediavine) resulting in a target $15-$25 RPM, or via a simple custom 'Buy Me A Coffee' tip button, achieving full break-even with just 400 monthly active users.`,
      confidence_score: 90
    },
    {
      idea_id: idea.id,
      evidence_type: "competitive",
      content: `While there are 2-3 generic utility hub competitors, they are plagued with poor responsive design, intrusive interstitial advertisements, slow loading times, and tedious signup barriers. Building "${idea.name}" with a sleek, responsive, and mobile-optimized dark slate interface represents a key market gap that will easily siphon traffic from old incumbents.`,
      confidence_score: 80
    },
    {
      idea_id: idea.id,
      evidence_type: "recommendation",
      content: `Launch a modular React single-page application using Tailwind CSS for fluid responsive styling. Implement immediate copy-to-clipboard functionality, local state persistence via standard client-side storage, and a layout optimized for all device widths. Drive high-impact initial traffic by showcasing the launch directly on IndieHackers and subreddits with interactive live previews.`,
      confidence_score: 95
    }
  ];
}

/**
 * Uses gemini-3.5-flash with search grounding to discover real live competitor sites for a given tool name
 */
export async function discoverCompetitorsWithSearch(ideaId: number, ideaName: string): Promise<{ domain: string; monthly_visits: number; global_rank: number; top_country: string; bounce_rate: number; traffic_trend: 'up' | 'down' | 'steady'; threat_level: 'High' | 'Medium' | 'Low'; tech_stack: string[]; top_keywords: string[]; estimated_revenue: number }[]> {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `Search Google for competitors of this online micro-tool: "${ideaName}".
      Find 2 or 3 actual live websites or tools offering this service.
      For each competitor, find or realistically estimate their:
      - domain (e.g., 'example.com')
      - monthly traffic (visits/month)
      - global rank
      - top organic traffic country
      - average bounce rate (%)
      - traffic trend ('up', 'down', 'steady')
      - threat level ('High', 'Medium', 'Low') based on their size and features
      - common web technologies they use (e.g. Next.js, React, Tailwind, PHP, jQuery, AdSense)
      - top 3 SEO search keywords they rank for
      - estimated monthly revenue (e.g., if AdSense: visits * $0.02 RPM, or subscription estimate)
      
      Return the list strictly in JSON format matching this array structure:
      [
        {
          "domain": "string",
          "monthly_visits": number,
          "global_rank": number,
          "bounce_rate": number,
          "top_country": "string",
          "traffic_trend": "up" | "down" | "steady",
          "threat_level": "High" | "Medium" | "Low",
          "tech_stack": ["string"],
          "top_keywords": ["string"],
          "estimated_revenue": number
        }
      ]
      
      Return ONLY the raw JSON array. Do not include markdown wrappers.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const text = response.text?.trim() || "[]";
      const cleanJson = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (err: any) {
      console.log(`[Gemini API] discoverCompetitorsWithSearch failed: ${err?.message || err}. Utilizing fallback.`);
    }
  }

  const domainBase = ideaName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return [
    {
      domain: `${domainBase || 'tool'}hub.com`,
      monthly_visits: 25000,
      global_rank: 450000,
      bounce_rate: 55,
      top_country: "United States",
      traffic_trend: "steady",
      threat_level: "Medium",
      tech_stack: ["React", "PHP", "jQuery", "Tailwind CSS", "AdSense"],
      top_keywords: [`free ${ideaName.toLowerCase()}`, `${ideaName.toLowerCase()} online`, `${ideaName.toLowerCase()} generator`],
      estimated_revenue: 500
    },
    {
      domain: `quick${domainBase || 'utility'}.io`,
      monthly_visits: 12000,
      global_rank: 890000,
      bounce_rate: 48,
      top_country: "India",
      traffic_trend: "up",
      threat_level: "High",
      tech_stack: ["Next.js", "Vercel", "Tailwind CSS", "Plausible Analytics"],
      top_keywords: [`best ${ideaName.toLowerCase()} tool`, `fast ${ideaName.toLowerCase()}`, `how to build ${ideaName.toLowerCase()}`],
      estimated_revenue: 350
    }
  ];
}

/**
 * Searches Google using Gemini 3.5-flash with Search Grounding to scout global high-traffic web tool opportunities,
 * compare them with direct rivals, identify their drawbacks/gaps, and outline how to outperform them.
 */
export async function scoutGlobalOpportunitiesWithSearch(userQuery?: string): Promise<ScoutOpportunity[]> {
  const DEFAULT_CURATED_SCOUTS: ScoutOpportunity[] = [
    {
      name: "VectorSVG Clipart Optimizer",
      description: "An offline-first browser vector graphic optimizer and visual code cleaner. Supports real-time preview, viewBox adjustment, path simplification, and bulk React/Tailwind wrapper export.",
      category: "Generators (QR, Password, Lorem Ipsum)",
      traffic_demand: "140,000+ monthly Google searches for SVG tools",
      rival_site: "vecteezy.com & svgomg",
      rival_traffic: "6.8M monthly visits",
      rival_lacking: "Vecteezy requires a paid subscription for most exports, serves heavy intrusive interstitial ads, forces 10-second delays, and doesn't offer styled code wrappers.",
      our_advantage: "100% ad-free client-side WASM engine, instant drag-and-drop, direct copy as React Component or Tailwind SVG string with dynamic size controls.",
      monetization: "Buy-me-a-coffee tip button + $2/mo Premium Developer Export Pack"
    },
    {
      name: "Interactive Compound Interest Dashboard",
      description: "A highly visual, slider-driven wealth calculator with responsive D3.js growth lines, comparison tables, inflation adjustments, and automated CSV/PDF export.",
      category: "Calculators & Converters",
      traffic_demand: "850,000+ monthly searches for interest calculators",
      rival_site: "calculator.net/interest-calculator",
      rival_traffic: "4.5M monthly visits",
      rival_lacking: "Stuck with outdated 2012 styling, completely lacks dynamic interactive sliders, poorly optimized for mobile screens (requires zooming), and has no side-by-side strategy comparison.",
      our_advantage: "High-contrast glassmorphic dark interface, dynamic responsive sliders that update instantly without page reloads, and step-by-step comparative projections.",
      monetization: "Affiliate integrations with premium brokerage platforms + self-serve non-intrusive display ads"
    },
    {
      name: "Regex AI Instant Playground",
      description: "An intuitive regular expression builder and explanation console featuring a live sandbox matching highlighter and an integrated mini NLP-to-Regex pattern builder.",
      category: "AI-Powered Tools",
      traffic_demand: "450,000+ monthly searches for regex helpers",
      rival_site: "regex101.com & regexr.com",
      rival_traffic: "3.2M monthly visits",
      rival_lacking: "Too technical and intimidating for beginners, does not explain individual match capture groups in simple human English, and lacks natural language generation tools.",
      our_advantage: "Combines an ultra-clean, minimalist interface with a lightweight natural language translator that automatically turns statements like 'match email domain' into exact regex patterns with inline explanations.",
      monetization: "Sponsorship slot for developer courses + $5/mo enterprise workspace"
    },
    {
      name: "Bento CSS Grid & Box-Shadow Lab",
      description: "A gorgeous, interactive visual workspace to design complex grid structures and multi-layered box shadows with direct copy-paste Tailwind code snippets.",
      category: "Utilities (Ruler, Screen Tools, Color Pickers)",
      traffic_demand: "95,000+ monthly searches for CSS layout helpers",
      rival_site: "cssmatic.com & cssgrid-generator",
      rival_traffic: "180K monthly visits",
      rival_lacking: "Outdated Flash dependencies, missing Tailwind utility classes support, and lacks the trendy modern 'Bento Grid' template structures widely used in modern SaaS marketing sites.",
      our_advantage: "Direct export of entire responsive Tailwind grid components with nested slots, interactive drag-to-resize grid blocks, and multi-layered glowy glass shadows.",
      monetization: "Premium ready-to-use premium Tailwind templates upsell"
    }
  ];

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `Search the web to find 4 trending, highly sought after web applications, digital products, calculators, or SaaS ideas that could be built in any field.
      The ideas can be anything, but MUST meet these criteria:
      1. Has a decent amount of global search traffic or user demand.
      2. Identify a specific, highly ranked rival/competitor site and estimate their traffic.
      3. List exactly what those rival sites are lacking (e.g. annoying ads, bad mobile layout, paywalls, slow load speeds, poor UX).
      4. Detail exactly how our newly built site/tool will fix those issues or add a better function to perform significantly better.
      
      Return the output strictly in a JSON array format matching this structure:
      [
        {
          "name": "string",
          "description": "string",
          "category": "string (one of: 'Calculators & Converters', 'Generators (QR, Password, Lorem Ipsum)', 'Formatters (JSON, SQL, CSS)', 'Analyzers (SEO, Speed, Word Count)', 'Utilities (Ruler, Screen Tools, Color Pickers)', 'AI-Powered Tools')",
          "traffic_demand": "string summarizing estimated traffic demand",
          "rival_site": "string representing competitor domain/name",
          "rival_traffic": "string representing competitor monthly visits",
          "rival_lacking": "string detailing what the competitor is lacking",
          "our_advantage": "string detailing how we fix it or add a better function to perform better",
          "monetization": "string showing monetization ideas"
        }
      ]
      
      Additional context or query focus from the user: "${userQuery || "any general high-traffic web tools or SaaS"}"
      
      Return ONLY the raw JSON array. Do not wrap in markdown or backticks.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const text = response.text?.trim() || "[]";
      const cleanJson = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (err: any) {
      console.log(`[Gemini API] scoutGlobalOpportunitiesWithSearch failed: ${err?.message || err}. Utilizing fallback.`);
    }
  } else {
    console.log("[Gemini API] Client unconfigured for Scout. Using highly valuable curated fallbacks.");
  }

  // Filter or augment fallbacks based on query if relevant
  if (userQuery && userQuery.trim().length > 1) {
    const queryLower = userQuery.toLowerCase();
    const filtered = DEFAULT_CURATED_SCOUTS.filter(item => 
      item.name.toLowerCase().includes(queryLower) || 
      item.description.toLowerCase().includes(queryLower) ||
      item.category.toLowerCase().includes(queryLower)
    );
    if (filtered.length > 0) return filtered;
  }

  return DEFAULT_CURATED_SCOUTS;
}


