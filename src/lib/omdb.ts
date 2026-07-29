import fs from 'fs/promises';
import path from 'path';
import { fetchWithTimeout } from './fetcher';

const CACHE_PATH = path.join(process.cwd(), 'src', 'data', 'omdb-cache.json');

// In-memory write lock to prevent parallel writes from corrupting the file
let writePromise: Promise<void> = Promise.resolve();

async function readCache(): Promise<Record<string, any>> {
  try {
    const data = await fs.readFile(CACHE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeCacheEntry(imdbID: string, entry: any): Promise<void> {
  // Chain writes sequentially so they never stomp on each other
  writePromise = writePromise.then(async () => {
    try {
      const cache = await readCache();
      cache[imdbID] = entry;
      await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
    } catch (err) {
      console.error("Failed to write OMDB cache:", err);
    }
  });
  return writePromise;
}

export async function getMovieData(imdbID: string) {
  const rawKey = process.env.OMDB_API_KEY;
  const OMDB_API_KEY = rawKey ? rawKey.trim() : undefined;

  if (!OMDB_API_KEY) {
    console.warn("OMDB_API_KEY is not set.");
    return null;
  }

  try {
    // Try reading cache first
    const cache = await readCache();
    if (cache[imdbID]) {
      return cache[imdbID];
    }

    // Not in cache, fetch from OMDB
    const url = `https://www.omdbapi.com/?i=${imdbID}&apikey=${OMDB_API_KEY}`;
    const res = await fetchWithTimeout(url);

    if (!res.ok) return null;
    const data = await res.json();
    if (data.Response === "False") return null;

    // Save to cache (only in dev — Vercel can't write to source files)
    if (process.env.NODE_ENV === 'development') {
      await writeCacheEntry(imdbID, data);
    }

    return data;
  } catch (error) {
    console.error(`Error fetching movie ${imdbID}:`, error);
    return null;
  }
}

export async function searchMovies(query: string) {
  const rawKey = process.env.OMDB_API_KEY;
  const OMDB_API_KEY = rawKey ? rawKey.trim() : undefined;

  if (!OMDB_API_KEY) {
    throw new Error('OMDB API key missing');
  }

  const url = `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}`;
  const res = await fetchWithTimeout(url);

  if (!res.ok) {
    throw new Error('Failed to fetch from OMDB');
  }

  return await res.json();
}
