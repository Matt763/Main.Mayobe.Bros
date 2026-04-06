import { Request, Response, NextFunction } from 'express';

// ─── Threat tracking ──────────────────────────────────────────────────────────
const ipAttempts = new Map<string, { count: number; ts: number; blocked: boolean }>();
const blockedIPs = new Set<string>();
const suspiciousPatterns = [
  /\.\.\//,                         // Path traversal
  /<script/i,                        // XSS
  /union\s+select/i,                 // SQL injection
  /exec\s*\(/i,                      // Code execution
  /eval\s*\(/i,                      // Eval injection
  /\/etc\/passwd/i,                  // File read
  /javascript:/i,                    // JS proto
];

export type SecurityEvent = {
  id: string; ts: number; ip: string; method: string; path: string;
  threat: string; severity: 'low' | 'medium' | 'high' | 'critical';
  blocked: boolean; userAgent: string;
};

const securityLog: SecurityEvent[] = [];

function logThreat(event: Omit<SecurityEvent, 'id'>) {
  securityLog.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...event });
  if (securityLog.length > 1000) securityLog.pop();
}

function getIP(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export function securityMonitor(req: Request, res: Response, next: NextFunction) {
  const ip = getIP(req);
  const ua = req.headers['user-agent'] || '';
  const path = req.path;
  const method = req.method;
  const body = JSON.stringify(req.body || {});
  const query = JSON.stringify(req.query || {});
  const combined = `${path} ${body} ${query}`;

  // 1. Check if IP is blocked
  if (blockedIPs.has(ip)) {
    logThreat({ ts: Date.now(), ip, method, path, threat: 'BLOCKED_IP', severity: 'critical', blocked: true, userAgent: ua });
    return res.status(403).json({ error: 'Access denied' });
  }

  // 2. Scan for suspicious patterns
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(combined)) {
      logThreat({ ts: Date.now(), ip, method, path, threat: `PATTERN:${pattern.source.slice(0, 30)}`, severity: 'high', blocked: true, userAgent: ua });
      return res.status(400).json({ error: 'Invalid request' });
    }
  }

  // 3. Rate-limit non-auth API calls by IP (100 reqs/min)
  if (path.startsWith('/api/') && !path.startsWith('/api/auth/')) {
    const now = Date.now();
    const entry = ipAttempts.get(ip) || { count: 0, ts: now, blocked: false };
    if (now - entry.ts > 60_000) {
      ipAttempts.set(ip, { count: 1, ts: now, blocked: false });
    } else {
      entry.count++;
      if (entry.count > 100) {
        entry.blocked = true;
        blockedIPs.add(ip);
        logThreat({ ts: Date.now(), ip, method, path, threat: 'RATE_LIMIT_EXCEEDED', severity: 'high', blocked: true, userAgent: ua });
        return res.status(429).json({ error: 'Too many requests. IP temporarily blocked.' });
      }
      ipAttempts.set(ip, entry);
    }
  }

  // 4. Log suspicious user agents (bots / scanners)
  const suspiciousUAs = ['sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab', 'nuclei', 'dirbuster'];
  if (suspiciousUAs.some(s => ua.toLowerCase().includes(s))) {
    logThreat({ ts: Date.now(), ip, method, path, threat: 'SUSPICIOUS_UA', severity: 'medium', blocked: false, userAgent: ua });
  }

  next();
}

// ─── Public API for log access ────────────────────────────────────────────────
export function getSecurityLog(limit = 200): SecurityEvent[] {
  return securityLog.slice(0, limit);
}

export function unblockIP(ip: string) {
  blockedIPs.delete(ip);
  ipAttempts.delete(ip);
}

export function getBlockedIPs(): string[] {
  return Array.from(blockedIPs);
}
