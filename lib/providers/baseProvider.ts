import logger from '../logger';

export async function fetchWithTimeout(
  url: string, 
  timeoutMs: number,
  options?: { headers?: Record<string, string>; [key: string]: any }
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    // Merge default headers with custom headers
    const defaultHeaders = { 'Accept': 'application/json' };
    const mergedHeaders = { ...defaultHeaders, ...(options?.headers || {}) };
    
    const res = await fetch(url, { 
      signal: controller.signal, 
      next: { revalidate: 30 },
      headers: mergedHeaders,
      ...options // Merge any other options (but not headers since we already merged them)
    } as any);
    
    if (res.status === 429) {
      logger.warn(`Rate limited by external provider API`, { url: url.split('/')[2] });
      return [];
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    // Try to parse as JSON first
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    
    // If not JSON, return as text
    return await res.text();
  } finally {
    clearTimeout(timeoutId);
  }
}
