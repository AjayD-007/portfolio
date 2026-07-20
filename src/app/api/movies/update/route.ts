import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { imdbID, status } = await request.json();
    if (!imdbID || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'src', 'data', 'movies.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const movies = JSON.parse(fileContents);

    const index = movies.findIndex((m: any) => m.imdbID === imdbID);
    if (index === -1) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    // Toggle the status
    movies[index].status = status;
    
    // Adjust rating to match status
    if (status === 'watched' && movies[index].rating === 0) {
      movies[index].rating = 5;
    } else if (status === 'watch_later') {
      movies[index].rating = 0;
    }

    await fs.writeFile(filePath, JSON.stringify(movies, null, 2), 'utf8');

    return NextResponse.json({ success: true, movie: movies[index] });
  } catch (error) {
    console.error('Failed to update movies.json:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
