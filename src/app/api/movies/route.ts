import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: CORS_HEADERS });
  }

  try {
    const body = await request.json();
    const { imdbID, rating = 0, review = '', dateCompleted = '', status = 'watched' } = body;

    if (!imdbID) {
      return NextResponse.json({ error: 'Missing imdbID' }, { status: 400, headers: CORS_HEADERS });
    }

    const filePath = path.join(process.cwd(), 'src', 'data', 'movies.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const movies = JSON.parse(fileContents);

    // Check if it already exists
    if (movies.find((m: any) => m.imdbID === imdbID)) {
      return NextResponse.json({ error: 'Movie already exists in library' }, { status: 400, headers: CORS_HEADERS });
    }

    const newMovie = { imdbID, rating, review, dateCompleted, status };
    movies.unshift(newMovie); // Add to the top of the list

    await fs.writeFile(filePath, JSON.stringify(movies, null, 2), 'utf8');

    return NextResponse.json({ success: true, movie: newMovie }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Failed to write to movies.json:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: CORS_HEADERS });
  }
}
