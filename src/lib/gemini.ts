import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { JsonDb } from "../db/jsonDb.js";
import { Idea, Evidence } from "../types.js";

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

/**
 * Uses gemini-3.5-flash with Search Grounding to discover profitable micro-tool ideas
 */
export async function discoverIdeasWithSearchGrounding(queryPhrase?: string): Promise<Omit<Idea, 'id' | 'created_at' | 'is_watchlisted'>[]> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("Gemini client is not initialized. Please configure your GEMINI_API_KEY.");
  }

  const query = queryPhrase || "popular micro-tool requests r/SideProject indie SaaS utilities 2026";
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });

    const text = response.text?.trim() || "[]";
    // Strip markdown wrappers if any survived responseMimeType
    const cleanJson = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("Error in discoverIdeasWithSearchGrounding:", err);
    throw err;
  }
}

/**
 * Uses gemini-3.1-pro-preview with HIGH Thinking Level to produce detailed, high-quality evidence files and recommendations
 */
export async function generateDeepEvidenceAndRecommendations(idea: Idea): Promise<Omit<Evidence, 'id' | 'created_at'>[]> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("Gemini client is not initialized. Please configure your GEMINI_API_KEY.");
  }

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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH
        },
        responseMimeType: "application/json"
      }
    });

    const text = response.text?.trim() || "[]";
    const cleanJson = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("Error in generateDeepEvidenceAndRecommendations:", err);
    throw err;
  }
}

/**
 * Uses gemini-3.5-flash with search grounding to discover real live competitor sites for a given tool name
 */
export async function discoverCompetitorsWithSearch(ideaId: number, ideaName: string): Promise<{ domain: string; monthly_visits: number; global_rank: number; top_country: string; bounce_rate: number; traffic_trend: 'up' | 'down' | 'steady'; threat_level: 'High' | 'Medium' | 'Low'; tech_stack: string[]; top_keywords: string[]; estimated_revenue: number }[]> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("Gemini client is not initialized.");
  }

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

  try {
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
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("Error in discoverCompetitorsWithSearch:", err);
    return [];
  }
}
