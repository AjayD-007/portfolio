import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const OMDB_API_KEY = process.env.OMDB_API_KEY;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!OMDB_API_KEY) {
    return NextResponse.json({ error: 'OMDB API key missing' }, { status: 500 });
  }

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch from OMDB' }, { status: 500 });
  }
}
