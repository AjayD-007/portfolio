import React from "react";
import { LibraryClient } from "@/components/library/LibraryClient";
import { Movie, Book } from "@/components/library/types";
import booksData from "@/data/books.json";
import moviesRawData from "@/data/movies.json";
import { Metadata } from "next";
import { getMovieData } from "@/lib/omdb";

export const metadata: Metadata = {
  title: "Media Library | AjayD",
  description: "A collection of books, movies, and series I've enjoyed.",
};

export default async function LibraryPage() {
  // Fetch all movie metadata in parallel at build/request time
  const enrichedMovies: Movie[] = await Promise.all(
    moviesRawData.map(async (rawMovie: any) => {
      const omdbData = await getMovieData(rawMovie.imdbID);
      
      if (!omdbData) {
        return {
          title: `Unknown Movie (${rawMovie.imdbID})`,
          director: "Unknown",
          type: "Movie",
          genre: "Unknown",
          rating: rawMovie.rating,
          review: rawMovie.review || "",
          dateCompleted: rawMovie.dateCompleted || "",
          imdbID: rawMovie.imdbID,
          externalLink: `https://www.imdb.com/title/${rawMovie.imdbID}/`,
          status: rawMovie.status || "watched",
          language: "Unknown"
        };
      }

      const primaryLanguage = omdbData.Language ? omdbData.Language.split(',')[0].trim() : "Unknown";

      return {
        title: omdbData.Title,
        director: omdbData.Director !== "N/A" ? omdbData.Director : omdbData.Writer || "Unknown",
        type: omdbData.Type === "series" ? "Series" : "Movie",
        genre: omdbData.Genre,
        rating: rawMovie.rating,
        review: rawMovie.review || "",
        coverImageUrl: omdbData.Poster !== "N/A" ? omdbData.Poster : undefined,
        externalLink: `https://www.imdb.com/title/${rawMovie.imdbID}/`,
        dateCompleted: rawMovie.dateCompleted || "",
        imdbID: rawMovie.imdbID,
        status: rawMovie.status || "watched",
        language: primaryLanguage
      };
    })
  );

  return <LibraryClient books={booksData as Book[]} movies={enrichedMovies} />;
}
