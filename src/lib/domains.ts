import dns from 'dns';
import { DomainCheck, Settings } from '../types.js';
import { JsonDb } from '../db/jsonDb.js';

/**
 * Generates 5 .com domain variations for a given tool name
 */
export function generateDomainVariations(toolName: string): string[] {
  // Sanitize name: remove spaces, accents, special characters, convert to lowercase
  const cleanName = toolName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (!cleanName) return [];

  const hyphenated = toolName
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  const variations = [
    `${cleanName}.com`,
    `get${cleanName}.com`,
    `use${cleanName}.com`,
    `${cleanName}tool.com`,
    `${cleanName}app.com`
  ];

  if (hyphenated && hyphenated !== cleanName) {
    variations.push(`${hyphenated}.com`);
  }

  // Deduplicate and slice to top 5
  return [...new Set(variations)].slice(0, 5);
}

/**
 * Performs DNS resolution check as Fallback 3
 */
async function checkDnsAvailability(domain: string): Promise<{ available: boolean; source: string; registrar?: string; ageYears?: number }> {
  return new Promise((resolve) => {
    dns.resolve(domain, 'A', (err, addresses) => {
      if (!err && addresses && addresses.length > 0) {
        // DNS record exists -> Taken
        resolve({ available: false, source: 'DNS Lookup' });
        return;
      }

      // Check NS record as well
      dns.resolve(domain, 'NS', (errNS, nsAddresses) => {
        if (!errNS && nsAddresses && nsAddresses.length > 0) {
          resolve({ available: false, source: 'DNS Lookup (NS)' });
        } else {
          // No records found -> Likely Available
          resolve({ available: true, source: 'DNS Lookup (No A/NS)' });
        }
      });
    });
  });
}

/**
 * Validates domain availability across multiple APIs and falls back to DNS lookup
 */
export async function checkDomainAvailability(domain: string, settings: Settings): Promise<Omit<DomainCheck, 'id' | 'idea_id' | 'checked_at'>> {
  const apiKeyWhoisJson = process.env.WHOISJSON_API_KEY || settings.whoisjson_api_key;
  const apiKeyWhoisXml = process.env.WHOISXML_API_KEY || settings.whoisxml_api_key;
  const apiKeyNinjas = process.env.NINJAS_API_KEY || settings.ninjas_api_key;

  // 1. Primary: WhoisJSON
  if (apiKeyWhoisJson) {
    try {
      const response = await fetch(`https://whoisjson.com/api/v1/domain-availability?domain=${domain}`, {
        headers: { 'Authorization': `Bearer ${apiKeyWhoisJson}` }
      });
      if (response.ok) {
        const data = await response.json();
        return {
          domain_name: domain,
          is_available: !!data.available,
          registrar: data.registrar || undefined,
          creation_date: data.creation_date || undefined,
          status: data.available ? 'Available' : 'Taken'
        };
      }
    } catch (e) {
      console.warn("WhoisJSON API check failed:", e);
    }
  }

  // 2. Fallback 1: WhoisXML API
  if (apiKeyWhoisXml) {
    try {
      const response = await fetch(`https://domain-availability.whoisxmlapi.com/api/v1?apiKey=${apiKeyWhoisXml}&domainName=${domain}&credits=DA`);
      if (response.ok) {
        const data = await response.json();
        const available = data.DomainInfo?.domainAvailability === 'UNREGISTERED';
        return {
          domain_name: domain,
          is_available: available,
          status: available ? 'Available' : 'Taken'
        };
      }
    } catch (e) {
      console.warn("WhoisXML API check failed:", e);
    }
  }

  // 3. Fallback 2: API-Ninjas
  if (apiKeyNinjas) {
    try {
      const response = await fetch(`https://api.api-ninjas.com/v1/domain?domain=${domain}`, {
        headers: { 'X-Api-Key': apiKeyNinjas }
      });
      if (response.ok) {
        const data = await response.json();
        // data.available is true/false
        return {
          domain_name: domain,
          is_available: !!data.available,
          registrar: data.registrar || undefined,
          creation_date: data.creation_date ? new Date(data.creation_date * 1000).toISOString() : undefined,
          status: data.available ? 'Available' : 'Taken'
        };
      }
    } catch (e) {
      console.warn("API-Ninjas check failed:", e);
    }
  }

  // 4. Fallback 3: Live DNS check
  try {
    const dnsResult = await checkDnsAvailability(domain);
    return {
      domain_name: domain,
      is_available: dnsResult.available,
      registrar: dnsResult.registrar || (dnsResult.available ? undefined : 'Unresolved DNS (Taken)'),
      status: dnsResult.available ? 'Available' : 'Taken'
    };
  } catch (err) {
    return {
      domain_name: domain,
      is_available: false,
      status: 'Unknown'
    };
  }
}
