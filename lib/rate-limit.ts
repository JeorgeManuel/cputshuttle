const windowMs = 15 * 60 * 1000; // 15 minutes
const maxAttempts = 10;

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export function isRateLimited(request: Request, action: string): boolean {
  const ip = getClientIp(request);
  const key = `${action}:${ip}`;
  const now = Date.now();

  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  if (entry.count > maxAttempts) {
    return true;
  }

  return false;
}
