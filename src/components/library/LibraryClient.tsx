"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BookOpen, Film, Tv } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Grid } from "@/components/layout/Grid";
import { Button } from "@/components/ui/Button";
import { Heading, Text } from "@/components/ui/Typography";

import { Book, Movie } from "./types";
import { MediaCard } from "./MediaCard";
import { LibraryDashboard } from "./LibraryDashboard";

export function LibraryClient({ books, movies }: { books: Book[], movies: Movie[] }) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "books" | "movies" | "series">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<"All" | "Watched" | "Watch Later">("All");
  const [genreFilter, setGenreFilter] = useState<string>("All");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setVisibleCount(12);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTabChange = (tab: "dashboard" | "books" | "movies" | "series") => {
    setActiveTab(tab);
    setSearchQuery("");
    setDebouncedQuery("");
    setStatusFilter("All");
    setGenreFilter("All");
    setVisibleCount(12);
  };

  // Extract unique genres for the current tab
  const uniqueGenres = useMemo(() => {
    if (activeTab === "dashboard") return [];
    const genres = new Set<string>();
    
    if (activeTab === "books") {
      books.forEach(b => {
        if (b.genre) genres.add(b.genre);
      });
    } else {
      const targetType = activeTab === "movies" ? "movie" : "series";
      movies.forEach(m => {
        if (m.type.toLowerCase() === targetType && m.genre) {
          m.genre.split(',').forEach(g => genres.add(g.trim()));
        }
      });
    }
    
    return Array.from(genres).sort();
  }, [books, movies, activeTab]);

  const getFilteredData = () => {
    if (activeTab === "dashboard") return [];
    const q = debouncedQuery.toLowerCase();
    
    if (activeTab === "books") {
      return books.filter((b) => {
        const matchesQuery = b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
        const matchesGenre = genreFilter === "All" || b.genre === genreFilter;
        return matchesQuery && matchesGenre;
      });
    } 
    
    const targetType = activeTab === "movies" ? "movie" : "series";
    
    return movies.filter((m) => {
      if (m.type.toLowerCase() !== targetType) return false;
      
      const matchesQuery = m.title.toLowerCase().includes(q) || m.director.toLowerCase().includes(q);
      if (!matchesQuery) return false;
      
      const isWatchLater = m.status === "watch_later";
      if (statusFilter === "Watched" && isWatchLater) return false;
      if (statusFilter === "Watch Later" && !isWatchLater) return false;
      
      if (genreFilter !== "All") {
        if (!m.genre || !m.genre.includes(genreFilter)) return false;
      }
      
      return true;
    });
  };

  const filteredData = getFilteredData();
  const displayedData = filteredData.slice(0, visibleCount);
  const hasMore = visibleCount < filteredData.length;

  // Analytics logic for the Dashboard
  const analytics = useMemo(() => {
    const moviesByLanguage: Record<string, number> = {};
    const seriesByLanguage: Record<string, number> = {};
    const booksByLangAndLength: Record<string, { Short: number; Full: number }> = {};
    
    let totalMoviesCount = 0;
    let totalSeriesCount = 0;

    movies.forEach(m => {
      const isSeries = m.type.toLowerCase() === "series";
      if (isSeries) totalSeriesCount++;
      else totalMoviesCount++;
      
      if (m.language && m.language !== "Unknown") {
        if (isSeries) {
          seriesByLanguage[m.language] = (seriesByLanguage[m.language] || 0) + 1;
        } else {
          moviesByLanguage[m.language] = (moviesByLanguage[m.language] || 0) + 1;
        }
      }
    });

    books.forEach(b => {
      if (b.language) {
        if (!booksByLangAndLength[b.language]) {
          booksByLangAndLength[b.language] = { Short: 0, Full: 0 };
        }
        if (b.length === "Short") booksByLangAndLength[b.language].Short++;
        if (b.length === "Full") booksByLangAndLength[b.language].Full++;
      }
    });

    return { 
      moviesByLanguage, 
      seriesByLanguage, 
      booksByLangAndLength, 
      totalMovies: totalMoviesCount,
      totalSeries: totalSeriesCount,
      totalBooks: books.length
    };
  }, [books, movies]);

  return (
    <Container maxWidth="7xl" >
      <Section spacing="none" className="mb-4 md:mb-6">
        <Heading level={1} variant="section">
          Media Library
        </Heading>
        <Text variant="body">
          A static collection of books, movies, and series I've enjoyed.
        </Text>
        
        {/* Main Tabs and Search */}
        <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex gap-2 bg-[var(--bg-surface-elevated)] p-1 rounded-xl border border-[var(--border-subtle)]">
            <Button 
              variant={activeTab === "dashboard" ? "primary" : "ghost"} 
              size="sm" 
              onClick={() => handleTabChange("dashboard")}
              className={activeTab !== "dashboard" ? "opacity-70 hover:opacity-100" : ""}
            >
              Dashboard
            </Button>
            <Button 
              variant={activeTab === "books" ? "primary" : "ghost"} 
              size="sm" 
              onClick={() => handleTabChange("books")}
              className={activeTab !== "books" ? "opacity-70 hover:opacity-100" : ""}
            >
              Books
            </Button>
            <Button 
              variant={activeTab === "movies" ? "primary" : "ghost"} 
              size="sm" 
              onClick={() => handleTabChange("movies")}
              className={activeTab !== "movies" ? "opacity-70 hover:opacity-100" : ""}
            >
              Movies
            </Button>
            <Button 
              variant={activeTab === "series" ? "primary" : "ghost"} 
              size="sm" 
              onClick={() => handleTabChange("series")}
              className={activeTab !== "series" ? "opacity-70 hover:opacity-100" : ""}
            >
              Series
            </Button>
          </div>
          
          {activeTab !== "dashboard" && (
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 sm:ml-auto px-4 py-2 bg-[var(--bg-surface-deep)] text-[var(--text-main)] border border-[var(--border-main)] rounded-lg focus:outline-none focus:border-[var(--accent-primary)] focus:shadow-[var(--shadow-glow-cyan)] transition-all text-sm"
            />
          )}
        </div>

        {/* Filters Bar */}
        {(activeTab === "movies" || activeTab === "series") && (
          <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            
            {/* Status Filters */}
            <div className="flex gap-2 bg-[var(--bg-surface-elevated)] p-1 rounded-full border border-[var(--border-subtle)]">
              {(["All", "Watched", "Watch Later"] as const).map(status => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setVisibleCount(12);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    statusFilter === status 
                      ? "bg-[var(--accent-primary)] text-black shadow-md" 
                      : "text-[var(--text-muted)] hover:text-white"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Genre Filters */}
            {uniqueGenres.length > 0 && (
              <div className="flex gap-2 items-center overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                <span className="text-sm text-[var(--text-muted)] mr-2 whitespace-nowrap">Genre:</span>
                <select
                  value={genreFilter}
                  onChange={(e) => {
                    setGenreFilter(e.target.value);
                    setVisibleCount(12);
                  }}
                  className="bg-[var(--bg-surface-elevated)] text-[var(--text-main)] font-semibold text-xs px-4 py-2 rounded-full border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                  <option value="All">All Genres</option>
                  {uniqueGenres.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* DASHBOARD VIEW */}
      {activeTab === "dashboard" && <LibraryDashboard analytics={analytics} />}

      {/* MEDIA GRID */}
      {activeTab !== "dashboard" && (
        <>
          <Grid columns={3}>
            {displayedData.map((item, idx) => (
              <MediaCard 
                key={activeTab + idx} 
                item={item} 
                isBook={activeTab === "books"} 
              />
            ))}
          </Grid>

          {/* Empty States */}
          {displayedData.length === 0 && (
            <div className="py-16 mt-8 text-center border border-dashed border-[var(--border-main)] rounded-2xl bg-[var(--bg-surface-elevated)]">
              {activeTab === "books" ? (
                <BookOpen className="w-12 h-12 text-[var(--text-muted)] opacity-20 mx-auto mb-4" />
              ) : activeTab === "series" ? (
                <Tv className="w-12 h-12 text-[var(--text-muted)] opacity-20 mx-auto mb-4" />
              ) : (
                <Film className="w-12 h-12 text-[var(--text-muted)] opacity-20 mx-auto mb-4" />
              )}
              <Text variant="muted">No {activeTab} found matching your criteria.</Text>
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
        </>
      )}
    </Container>
  );
}
