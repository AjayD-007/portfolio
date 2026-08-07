import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';

// Create a new ratelimiter, that allows 3 requests per 1 day
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '1 d'),
  analytics: true,
});

export async function GET(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    
    // Check rate limit
    const { success, limit, reset, remaining } = await ratelimit.limit(
      `ratelimit_resume_${ip}`
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again tomorrow.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }

    const filePath = path.join(process.cwd(), 'public', 'Ajay_Dharmaraj_resume.pdf');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Ajay_Dharmaraj_Resume.pdf"',
      },
    });
  } catch (error) {
    console.error('Error downloading resume:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
