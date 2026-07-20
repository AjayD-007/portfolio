"use client";

import React, { useState } from "react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Grid } from "@/components/layout/Grid";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Heading, Text } from "@/components/ui/Typography";
import { Search, Plus, Check } from "lucide-react";

type OmdbResult = {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
};

export default function LibraryManagePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OmdbResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Record<string, boolean>>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/omdb?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.Search) {
        setResults(data.Search);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleAdd = async (imdbID: string) => {
    try {
      const res = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imdbID,
          rating: 0,
          review: "Added to Watchlist.",
          dateCompleted: new Date().toISOString().split("T")[0],
        }),
      });
      if (res.ok) {
        setAdded((prev) => ({ ...prev, [imdbID]: true }));
      } else {
        const errorData = await res.json();
        alert(`Failed to add: ${errorData.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to add movie.");
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return (
      <Container maxWidth="3xl" className="py-16 text-center">
        <Heading level={2} variant="section">Access Denied</Heading>
        <Text variant="muted">This page is only available in local development.</Text>
      </Container>
    );
  }

  return (
    <Container maxWidth="7xl" className="py-4 md:py-8 z-10 flex-grow">
      <Section spacing="none" className="mb-10">
        <Heading level={1} variant="section">
          Manage Library
        </Heading>
        <Text variant="body" className="mb-6">
          Search OMDb and add movies/series to your local JSON database.
        </Text>
        
        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-2xl">
          <input
            type="text"
            placeholder="Search movies, series, anime..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow px-4 py-3 bg-[var(--bg-surface-deep)] text-[var(--text-main)] border border-[var(--border-main)] rounded-lg focus:outline-none focus:border-[var(--accent-primary)] focus:shadow-[var(--shadow-glow-cyan)] transition-all"
          />
          <Button type="submit" variant="primary" size="md" disabled={loading}>
            {loading ? "Searching..." : <><Search className="w-5 h-5 mr-2 inline" /> Search</>}
          </Button>
        </form>
      </Section>

      <Section spacing="default">
        <div className="bg-[var(--bg-surface-elevated)] p-6 rounded-xl border border-[var(--border-subtle)]">
          <Heading level={3} variant="section" className="!mb-4">
            IMDb Exploration Links
          </Heading>
          <Text variant="body" className="mb-4">
            Use the "Add to Library" bookmarklet on any of these pages to quickly build your library:
          </Text>
          
          <div className="space-y-6">
            <div>
              <Text variant="label" className="block mb-2 text-[var(--accent-primary)] font-bold">Greatest Lists</Text>
              <div className="flex flex-wrap gap-2">
                <a href="https://www.imdb.com/chart/top/" target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="sm">Top 250 Movies</Button></a>
                <a href="https://www.imdb.com/chart/toptv/" target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="sm">Top 250 TV</Button></a>
                <a href="https://www.imdb.com/chart/moviemeter/" target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="sm">Popular Movies</Button></a>
                <a href="https://www.imdb.com/search/title/?groups=oscar_best_picture_winners" target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="sm">Oscar Winners</Button></a>
                <a href="https://www.imdb.com/search/title/?genres=sci-fi&sort=user_rating,desc&title_type=feature&num_votes=100000," target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="sm">Top Sci-Fi</Button></a>
              </div>
            </div>

            <div>
              <Text variant="label" className="block mb-2 text-[var(--accent-primary)] font-bold">Top Directors</Text>
              <div className="flex flex-wrap gap-2">
                {[
                  {n:'Martin Scorsese', id:'nm0000217'}, {n:'Quentin Tarantino', id:'nm0000233'}, {n:'Christopher Nolan', id:'nm0634240'}, 
                  {n:'Steven Spielberg', id:'nm0000229'}, {n:'David Fincher', id:'nm0000399'}, {n:'Denis Villeneuve', id:'nm0898288'}, 
                  {n:'James Cameron', id:'nm0000116'}, {n:'Peter Jackson', id:'nm0001392'}, {n:'Ridley Scott', id:'nm0000631'}, {n:'Stanley Kubrick', id:'nm0000040'}
                ].map(({n, id}) => (
                  <a key={n} href={`https://www.imdb.com/name/${id}/`} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm">{n}</Button>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <Text variant="label" className="block mb-2 text-[var(--accent-primary)] font-bold">Hollywood Actors & Actresses</Text>
              <div className="flex flex-wrap gap-2">
                {[
                  {n:'Leonardo DiCaprio', id:'nm0000138'}, {n:'Brad Pitt', id:'nm0000093'}, {n:'Tom Cruise', id:'nm0000129'}, 
                  {n:'Denzel Washington', id:'nm0000243'}, {n:'Christian Bale', id:'nm0000288'}, {n:'Tom Hanks', id:'nm0000158'}, 
                  {n:'Robert De Niro', id:'nm0000134'}, {n:'Al Pacino', id:'nm0000199'}, {n:'Meryl Streep', id:'nm0000658'}, 
                  {n:'Cate Blanchett', id:'nm0000949'}, {n:'Natalie Portman', id:'nm0000204'}, {n:'Scarlett Johansson', id:'nm0424060'}
                ].map(({n, id}) => (
                  <a key={n} href={`https://www.imdb.com/name/${id}/`} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm">{n}</Button>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <Text variant="label" className="block mb-2 text-[var(--accent-primary)] font-bold">Tamil & Malayalam Legends</Text>
              <div className="flex flex-wrap gap-2">
                {[
                  {n:'Vetrimaaran', id:'nm4274575'}, {n:'Manikandan', id:'nm8904193'}, {n:'Lokesh Kanagaraj', id:'nm7992231'}, 
                  {n:'Nelson Dilipkumar', id:'nm12135964'}, {n:'Karthik Subbaraj', id:'nm5366274'}, {n:'Thalapathy Vijay', id:'nm0897201'}, 
                  {n:'Suriya', id:'nm1421814'}, {n:'Rajinikanth', id:'nm0707425'}, {n:'Kamal Haasan', id:'nm0352032'}, 
                  {n:'Dhanush', id:'nm1333687'}, {n:'Vikram', id:'nm1417314'}, {n:'Vijay Sethupathi', id:'nm4043111'}, 
                  {n:'Mammootty', id:'nm0007123'}, {n:'Mohanlal', id:'nm0482320'}, {n:'Fahadh Faasil', id:'nm1335704'}, {n:'Dulquer Salmaan', id:'nm4921260'}
                ].map(({n, id}) => (
                  <a key={n} href={`https://www.imdb.com/name/${id}/`} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm">{n}</Button>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <Text variant="label" className="block mb-2 text-[var(--accent-primary)] font-bold">Telugu & Kannada Legends</Text>
              <div className="flex flex-wrap gap-2">
                {[
                  {n:'SS Rajamouli', id:'nm1442514'}, {n:'Prashanth Neel', id:'nm6073824'}, {n:'Prabhas', id:'nm1659141'}, 
                  {n:'Allu Arjun', id:'nm1084853'}, {n:'Ram Charan', id:'nm2776304'}, {n:'Jr NTR', id:'nm1694524'}, 
                  {n:'Yash', id:'nm5232139'}, {n:'Rishab Shetty', id:'nm6142895'}, {n:'Rakshit Shetty', id:'nm5756214'}
                ].map(({n, id}) => (
                  <a key={n} href={`https://www.imdb.com/name/${id}/`} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm">{n}</Button>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Grid columns={4}>
        {results.map((item) => (
          <Card key={item.imdbID} variant="interactive" className="flex flex-col">
            <div className="w-full aspect-[2/3] rounded-md overflow-hidden mb-4 bg-black">
              {item.Poster !== "N/A" ? (
                <img src={item.Poster} alt={item.Title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
              )}
            </div>
            <Heading level={3} variant="card-subtitle" className="line-clamp-2">
              {item.Title}
            </Heading>
            <Text variant="muted" className="mb-4">{item.Year} • {item.Type}</Text>
            
            <div className="mt-auto">
              <Button 
                variant={added[item.imdbID] ? "secondary" : "primary"} 
                size="sm" 
                className="w-full justify-center"
                onClick={() => handleAdd(item.imdbID)}
                disabled={added[item.imdbID]}
              >
                {added[item.imdbID] ? (
                  <><Check className="w-4 h-4 mr-2" /> Added</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" /> Add to JSON</>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </Grid>
    </Container>
  );
}
