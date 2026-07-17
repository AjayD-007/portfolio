"use client";

import React, { useState } from "react";
import booksData from "@/data/books.json";
import moviesData from "@/data/movies.json";
import { ArrowRight, BookOpen, Film } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Grid } from "@/components/layout/Grid";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Heading, Text } from "@/components/ui/Typography";
import { Badge } from "@/components/ui/Badge";

type Book = {
  title: string;
  author: string;
  genre: string;
  rating: number | string;
  review: string;
  coverImageUrl?: string;
  externalLink?: string;
  dateCompleted: string;
};

type Movie = {
  title: string;
  director: string;
  type: string;
  genre: string;
  rating: number | string;
  review: string;
  coverImageUrl?: string;
  externalLink?: string;
  dateCompleted: string;
};

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<"books" | "movies">("books");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);

  const handleTabChange = (tab: "books" | "movies") => {
    setActiveTab(tab);
    setSearchQuery("");
    setVisibleCount(12);
  };

  const filteredBooks = (booksData as Book[]).filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMovies = (moviesData as Movie[]).filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.director.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedBooks = filteredBooks.slice(0, visibleCount);
  const displayedMovies = filteredMovies.slice(0, visibleCount);

  const hasMore =
    activeTab === "books"
      ? visibleCount < filteredBooks.length
      : visibleCount < filteredMovies.length;

  return (
    <Container maxWidth="7xl" >
      <Section spacing="none" className="mb-4 md:mb-6">
        <Heading level={1} variant="section">
          Media Library
        </Heading>
        <Text variant="body">
          A static collection of books, movies, and series I've enjoyed.
        </Text>
        
        <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex gap-2">
            <Button 
              variant={activeTab === "books" ? "primary" : "ghost"} 
              size="sm" 
              onClick={() => handleTabChange("books")}
            >
              Books
            </Button>
            <Button 
              variant={activeTab === "movies" ? "primary" : "ghost"} 
              size="sm" 
              onClick={() => handleTabChange("movies")}
            >
              Movies & Series
            </Button>
          </div>
          
          <input
            type="text"
            placeholder={activeTab === "books" ? "Search books..." : "Search movies..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(12);
            }}
            className="w-full sm:w-64 sm:ml-auto px-4 py-2 bg-[var(--bg-surface-deep)] text-[var(--text-main)] border border-[var(--border-main)] rounded-lg focus:outline-none focus:border-[var(--accent-primary)] focus:shadow-[var(--shadow-glow-cyan)] transition-all text-sm"
          />
        </div>
      </Section>

      <Grid columns={3}>
        {activeTab === "books" && displayedBooks.map((book, idx) => (
          <a
            key={idx}
            href={book.externalLink || "#"}
            target={book.externalLink ? "_blank" : "_self"}
            rel="noopener noreferrer"
            className="group h-full block"
          >
            <Card variant="interactive" className="h-full flex flex-col justify-between hover:scale-[1.02] hover:-translate-y-1">
              
              {book.coverImageUrl ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 relative bg-black flex items-center justify-center border border-[var(--border-subtle)]">
                  {/* Dynamic blurred background */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-50 blur-xl scale-125 transition-opacity duration-700 group-hover:opacity-80" 
                    style={{ backgroundImage: `url(${book.coverImageUrl})` }} 
                  />
                  {/* Dark overlay to ensure text/image contrast */}
                  <div className="absolute inset-0 bg-black/40" />
                  
                  {/* Crisp, contained cover */}
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    className="w-auto h-[85%] object-contain relative z-10 rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)] group-hover:scale-105 group-hover:rotate-2 transition-all duration-700"
                  />
                </div>
              ) : (
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 relative bg-[var(--bg-surface-deep)] flex items-center justify-center border border-[var(--border-subtle)]">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.15)_0%,_transparent_70%)]" />
                  <BookOpen className="w-16 h-16 text-[var(--text-muted)] opacity-50 relative z-10 drop-shadow-lg" />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2 gap-4">
                  <Heading level={3} variant="card-interactive" className="!mb-0 group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1">
                    {book.title}
                  </Heading>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[var(--accent-primary)] transition-colors opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 duration-300 shrink-0" />
                </div>
                <Text variant="muted" className="mb-6 line-clamp-1">
                  {book.author}
                </Text>
              </div>
              
              <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="outline">{book.genre}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-amber-500 text-lg leading-none">★</span>
                  <Text variant="label" className="!tracking-normal text-sm font-bold">{book.rating}</Text>
                </div>
              </div>
            </Card>
          </a>
        ))}

        {activeTab === "movies" && displayedMovies.map((movie, idx) => (
          <a
            key={idx}
            href={movie.externalLink || "#"}
            target={movie.externalLink ? "_blank" : "_self"}
            rel="noopener noreferrer"
            className="group h-full block"
          >
            <Card variant="interactive" className="h-full flex flex-col justify-between hover:scale-[1.02] hover:-translate-y-1">
              
              {movie.coverImageUrl ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 relative bg-black flex items-center justify-center border border-[var(--border-subtle)]">
                  {/* Dynamic blurred background */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-50 blur-xl scale-125 transition-opacity duration-700 group-hover:opacity-80" 
                    style={{ backgroundImage: `url(${movie.coverImageUrl})` }} 
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/40" />
                  
                  {/* Crisp, contained poster */}
                  <img
                    src={movie.coverImageUrl}
                    alt={movie.title}
                    className="w-auto h-[85%] object-contain relative z-10 rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)] group-hover:scale-105 group-hover:rotate-2 transition-all duration-700"
                  />
                </div>
              ) : (
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 relative bg-[var(--bg-surface-deep)] flex items-center justify-center border border-[var(--border-subtle)]">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.15)_0%,_transparent_70%)]" />
                  <Film className="w-16 h-16 text-[var(--text-muted)] opacity-50 relative z-10 drop-shadow-lg" />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2 gap-4">
                  <Heading level={3} variant="card-interactive" className="!mb-0 group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1">
                    {movie.title}
                  </Heading>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[var(--accent-primary)] transition-colors opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 duration-300 shrink-0" />
                </div>
                <Text variant="muted" className="mb-6 line-clamp-1">
                  {movie.director}
                </Text>
              </div>
              
              <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="solid">{movie.type}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-amber-500 text-lg leading-none">★</span>
                  <Text variant="label" className="!tracking-normal text-sm font-bold">{movie.rating}</Text>
                </div>
              </div>
            </Card>
          </a>
        ))}
      </Grid>

      {/* Empty States */}
      {activeTab === "books" && displayedBooks.length === 0 && (
        <div className="py-16 mt-8 text-center border border-dashed border-[var(--border-main)] rounded-2xl bg-[var(--bg-surface-elevated)]">
          <BookOpen className="w-12 h-12 text-[var(--text-muted)] opacity-20 mx-auto mb-4" />
          <Text variant="muted">No books found matching your criteria.</Text>
        </div>
      )}
      {activeTab === "movies" && displayedMovies.length === 0 && (
        <div className="py-16 mt-8 text-center border border-dashed border-[var(--border-main)] rounded-2xl bg-[var(--bg-surface-elevated)]">
          <Film className="w-12 h-12 text-[var(--text-muted)] opacity-20 mx-auto mb-4" />
          <Text variant="muted">No movies/series found matching your criteria.</Text>
        </div>
      )}

      {/* Pagination */}
      {hasMore && (
        <div className="flex justify-center mt-12">
          <Button 
            variant="secondary"
            onClick={() => setVisibleCount((prev) => prev + 12)}
          >
            Load More
          </Button>
        </div>
      )}
    </Container>
  );
}
