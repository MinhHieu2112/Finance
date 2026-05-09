import { type Request, type Response, type NextFunction } from 'express';
import AppError from '../utils/appError';

type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request, res: Response) => string;
  message?: string;
};

type RateBucket = {
  count: number;
  resetAt: number;
};

const getClientIp = (req: Request) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};

export const createRateLimiter = (options: RateLimitOptions) => {
  const buckets = new Map<string, RateBucket>();
  const windowMs = Math.max(1000, options.windowMs);
  const max = Math.max(1, options.max);

  return (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator ? options.keyGenerator(req, res) : getClientIp(req);
    const now = Date.now();

    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      existing.count += 1;
      buckets.set(key, existing);
    }

    const current = buckets.get(key)!;
    const remaining = Math.max(max - current.count, 0);

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(current.resetAt / 1000)));

    if (current.count > max) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return next(new AppError(options.message || 'Too many requests, please try again later.', 429));
    }

    return next();
  };
};
