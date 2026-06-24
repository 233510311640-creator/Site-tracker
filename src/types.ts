export interface Idea {
  id: number;
  name: string;
  description: string;
  category: string;
  source: string;
  source_url: string;
  upvotes: number;
  comments: number;
  opportunity_score: number;
  demand_score: number;
  competition_score: number;
  monetization_score: number;
  simplicity_score: number;
  created_at: string;
  is_watchlisted: boolean;
}

export interface DomainCheck {
  id: number;
  idea_id: number;
  domain_name: string;
  is_available: boolean;
  registrar?: string;
  creation_date?: string;
  checked_at: string;
  status: 'Available' | 'Taken' | 'Unknown';
}

export interface Competitor {
  id: number;
  idea_id: number;
  domain: string;
  monthly_visits: number;
  global_rank: number;
  bounce_rate: number;
  top_country: string;
  traffic_trend: 'up' | 'down' | 'steady';
  threat_level: 'High' | 'Medium' | 'Low';
  last_checked: string;
  estimated_revenue?: number;
  tech_stack?: string[];
  backlinks_count?: number;
  top_keywords?: string[];
}

export interface MySite {
  id: number;
  domain: string;
  tool_name: string;
  launch_date: string;
  tech_stack: string[];
  monetization: string;
  ga4_property?: string;
  gsc_property?: string;
  monthly_traffic: number;
  monthly_revenue: number;
  github_repo?: string;
  status: 'Active' | 'Under Development' | 'Archived';
}

export interface Evidence {
  id: number;
  idea_id: number;
  evidence_type: 'market' | 'financial' | 'competitive' | 'recommendation';
  content: string;
  confidence_score: number; // 0 - 100
  created_at: string;
}

export interface Settings {
  gemini_api_key?: string;
  whoisjson_api_key?: string;
  whoisxml_api_key?: string;
  ninjas_api_key?: string;
  serpapi_api_key?: string;
  semrush_api_key?: string;
}
