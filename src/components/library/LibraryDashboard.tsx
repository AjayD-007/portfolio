import React from "react";
import { Film, Tv, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Heading, Text } from "@/components/ui/Typography";
import { Stack } from "@/components/layout/Stack";
import { Grid } from "@/components/layout/Grid";

type Analytics = {
  moviesByLanguage: Record<string, number>;
  seriesByLanguage: Record<string, number>;
  booksByLangAndLength: Record<string, { Short: number; Full: number }>;
  totalMovies: number;
  totalSeries: number;
  totalBooks: number;
};

export function LibraryDashboard({ analytics }: { analytics: Analytics }) {
  return (
    <Stack>
      {/* Books - Full Width */}
      <Card variant="default" className="p-8 bg-[var(--bg-surface-elevated)]">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[var(--text-muted)]" />
            <Heading level={3} className="!mb-0 text-2xl">Books</Heading>
          </div>
          <div className="text-right">

            <div className="text-3xl font-light text-[var(--text-main)]">{analytics.totalBooks}</div>
          </div>
        </div>

        <Grid columns={3}>
          {Object.entries(analytics.booksByLangAndLength).map(([lang, counts]) => (
            <div key={lang}>
              <Text variant="label" className="block mb-4 text-[var(--accent-primary)] font-bold">{lang}</Text>
              <div className="flex justify-between items-center pb-2 border-b border-[var(--border-subtle)]">
                <Text variant="body">Full Novels</Text>
                <Text variant="muted" className="font-mono">{counts.Full}</Text>
              </div>
              <div className="flex justify-between items-center pt-2">
                <Text variant="body">Short Stories</Text>
                <Text variant="muted" className="font-mono">{counts.Short}</Text>
              </div>
            </div>
          ))}
          {Object.keys(analytics.booksByLangAndLength).length === 0 && (
            <Text variant="muted" className="italic text-sm">No books data</Text>
          )}
        </Grid>
      </Card>

      {/* Movies and Series - 50/50 */}
      <Grid columns={2}>
        {/* Movies */}
        <Card variant="default" className="p-8 bg-[var(--bg-surface-elevated)] h-full flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <Film className="w-5 h-5 text-[var(--text-muted)]" />
              <Heading level={3} className="!mb-0 text-xl">Movies</Heading>
            </div>
            <div className="text-right">

              <div className="text-2xl font-light text-[var(--text-main)]">{analytics.totalMovies}</div>
            </div>
          </div>
          <Stack>
            {Object.entries(analytics.moviesByLanguage)
              .sort((a, b) => b[1] - a[1]) // Sort descending
              .map(([lang, count]) => (
                <div key={lang} className="flex justify-between items-center pb-2 border-b border-[var(--border-subtle)] last:border-0">
                  <Text variant="body">{lang}</Text>
                  <Text variant="muted" className="font-mono">{count}</Text>
                </div>
              ))}
            {Object.keys(analytics.moviesByLanguage).length === 0 && (
              <Text variant="muted" className="text-center py-4 italic text-sm">No language data</Text>
            )}
          </Stack>
        </Card>

        {/* Series */}
        <Card variant="default" className="p-8 bg-[var(--bg-surface-elevated)] h-full flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <Tv className="w-5 h-5 text-[var(--text-muted)]" />
              <Heading level={3} className="!mb-0 text-xl">Series</Heading>
            </div>
            <div className="text-right">

              <div className="text-2xl font-light text-[var(--text-main)]">{analytics.totalSeries}</div>
            </div>
          </div>
          <Stack>
            {Object.entries(analytics.seriesByLanguage)
              .sort((a, b) => b[1] - a[1]) // Sort descending
              .map(([lang, count]) => (
                <div key={lang} className="flex justify-between items-center pb-2 border-b border-[var(--border-subtle)] last:border-0">
                  <Text variant="body">{lang}</Text>
                  <Text variant="muted" className="font-mono">{count}</Text>
                </div>
              ))}
            {Object.keys(analytics.seriesByLanguage).length === 0 && (
              <Text variant="muted" className="text-center py-4 italic text-sm">No language data</Text>
            )}
          </Stack>
        </Card>

      </Grid>
    </Stack>
  );
}
