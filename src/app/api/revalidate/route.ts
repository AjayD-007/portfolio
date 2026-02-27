import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Optional: If you want to secure this route, you can require a secret token.
    // Uncomment the lines below and set MY_SECRET_TOKEN in your .env.local file.
    // const secret = request.nextUrl.searchParams.get('secret');
    // if (secret !== process.env.MY_SECRET_TOKEN) {
    //   return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    // }

    // Revalidate the main blogs list
    revalidatePath('/blogs');
    
    // Revalidate all individual blog post pages generated via generateStaticParams
    revalidatePath('/blogs/[slug]', 'page');

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    console.error('Error revalidating:', err);
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}
