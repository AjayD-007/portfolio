import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create a new ratelimiter that allows 5 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '10 s'),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Hash the IP to protect privacy
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedIp = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Rate Limiting
    const { success } = await ratelimit.limit(`ratelimit:views:${hashedIp}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Add unique viewer (Redis Sets guarantee uniqueness)
    await redis.sadd('portfolio:unique_visitors', hashedIp);
    
    // Get total number of unique viewers
    const totalViews = await redis.scard('portfolio:unique_visitors');

    return NextResponse.json({ views: totalViews });
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json({ error: 'Internal Server Error', views: 0 }, { status: 500 });
  }
}

export async function GET() {
  try {
    const totalViews = await redis.scard('portfolio:unique_visitors');
    return NextResponse.json({ views: totalViews });
  } catch (error) {
    console.error('Error fetching views:', error);
    return NextResponse.json({ error: 'Internal Server Error', views: 0 }, { status: 500 });
  }
}
