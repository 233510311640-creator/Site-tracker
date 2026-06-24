import { Competitor, Settings } from '../types.js';
import { JsonDb } from '../db/jsonDb.js';
import { discoverCompetitorsWithSearch } from './gemini.js';

/**
 * Fetches SimilarWeb data for a given competitor domain
 */
export async function fetchSimilarWebData(domain: string): Promise<Partial<Competitor> | null> {
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
  const url = `https://data.similarweb.com/api/v1/data?domain=${cleanDomain}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      console.warn(`SimilarWeb lookup failed for ${cleanDomain} - Status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const monthlyVisits = data.EstimatedMonthlyVisits || data.Engagements?.MonthTraffic || 0;
    const bounceRate = data.Engagements?.BounceRate ? Math.round(data.Engagements.BounceRate * 1000) / 10 : 45.0;
    const globalRank = data.GlobalRank?.Rank || 0;
    const topCountry = data.TopCountryShares?.[0]?.CountryName || data.CountryRank?.CountryName || 'United States';

    let threat_level: 'High' | 'Medium' | 'Low' = 'Low';
    if (monthlyVisits > 100000) {
      threat_level = 'High';
    } else if (monthlyVisits > 10000) {
      threat_level = 'Medium';
    }

    return {
      domain: cleanDomain,
      monthly_visits: monthlyVisits,
      global_rank: globalRank,
      bounce_rate: bounceRate,
      top_country: topCountry,
      threat_level,
      traffic_trend: 'steady'
    };
  } catch (err) {
    console.error(`SimilarWeb API request error for ${cleanDomain}:`, err);
    return null;
  }
}

/**
 * Syncs competitors for a specific idea.
 * First uses Gemini with Search Grounding to find actual competitors,
 * then attempts to enrich them with live SimilarWeb data, falling back to Gemini's highly accurate estimated data.
 */
export async function trackCompetitorsForIdea(ideaId: number, ideaName: string, settings: Settings): Promise<Competitor[]> {
  try {
    // 1. Discover competitors using Search Grounding
    const discovered = await discoverCompetitorsWithSearch(ideaId, ideaName);
    const savedCompetitors: Competitor[] = [];

    for (const comp of discovered) {
      // 2. Try to enrich with live SimilarWeb data
      let swData = await fetchSimilarWebData(comp.domain);
      
      const competitorPayload: Omit<Competitor, 'id' | 'last_checked'> = {
        idea_id: ideaId,
        domain: comp.domain,
        monthly_visits: swData?.monthly_visits || comp.monthly_visits || 1500,
        global_rank: swData?.global_rank || comp.global_rank || 1500000,
        bounce_rate: swData?.bounce_rate || comp.bounce_rate || 45,
        top_country: swData?.top_country || comp.top_country || 'United States',
        traffic_trend: comp.traffic_trend || 'steady',
        threat_level: swData?.threat_level || comp.threat_level || 'Low',
        estimated_revenue: comp.estimated_revenue || 0,
        tech_stack: comp.tech_stack || [],
        top_keywords: comp.top_keywords || []
      };

      // Save to local JSON DB
      const saved = JsonDb.addCompetitor(competitorPayload);
      savedCompetitors.push(saved);
    }

    return savedCompetitors;
  } catch (err) {
    console.error(`Error tracking competitors for ${ideaName}:`, err);
    return [];
  }
}
