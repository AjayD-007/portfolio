import React from "react";
import { ArrowRight, BookOpen, Film, Tv, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Heading, Text } from "@/components/ui/Typography";
import { Badge } from "@/components/ui/Badge";
import { Book, Movie } from "./types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function MediaCard({ 
  item, 
  isBook = false 
}: { 
  item: Book | Movie, 
  isBook?: boolean 
}) {
  const icon = isBook 
    ? <BookOpen className="w-16 h-16 text-[var(--text-muted)] opacity-50 relative z-10 drop-shadow-lg" />
    : (item as Movie).type === "Series" 
      ? <Tv className="w-16 h-16 text-[var(--text-muted)] opacity-50 relative z-10 drop-shadow-lg" />
      : <Film className="w-16 h-16 text-[var(--text-muted)] opacity-50 relative z-10 drop-shadow-lg" />;
      
  const gradientColor = isBook ? "rgba(139,92,246,0.15)" : "rgba(6,182,212,0.15)";
  const subtitle = isBook ? (item as Book).author : (item as Movie).director;
  const badgeLabel = isBook ? item.genre : (item as Movie).type;
  
  const isWatchLater = !isBook && (item as Movie).status === "watch_later";
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isBook || isUpdating) return;
    
    setIsUpdating(true);
    const movie = item as Movie;
    const newStatus = isWatchLater ? "watched" : "watch_later";
    
    try {
      const res = await fetch("/api/movies/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imdbID: movie.imdbID, status: newStatus }),
      });
      
      if (res.ok) {
        // Trigger a re-fetch of the server component data
        router.refresh();
      } else {
        console.error("Failed to update status");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <a
      href={item.externalLink || "#"}
      target={item.externalLink ? "_blank" : "_self"}
      rel="noopener noreferrer"
      className="group h-full block"
    >
      <Card variant="interactive" className="h-full flex flex-col justify-between hover:scale-[1.02] hover:-translate-y-1">
        
        {item.coverImageUrl ? (
          <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 relative bg-black flex items-center justify-center border border-[var(--border-subtle)]">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-50 blur-xl scale-125 transition-opacity duration-700 group-hover:opacity-80" 
              style={{ backgroundImage: `url(${item.coverImageUrl})` }} 
            />
            <div className="absolute inset-0 bg-black/40" />
            <img
              src={item.coverImageUrl}
              alt={item.title}
              className="w-auto h-[85%] object-contain relative z-10 rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)] group-hover:scale-105 group-hover:rotate-2 transition-all duration-700"
            />
            {isWatchLater && (
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 border border-white/10">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Watch Later</span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 relative bg-[var(--bg-surface-deep)] flex items-center justify-center border border-[var(--border-subtle)]">
            <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_${gradientColor}_0%,_transparent_70%)]`} />
            {icon}
            {isWatchLater && (
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 border border-white/10">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Watch Later</span>
              </div>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2 gap-4">
            <Heading level={3} variant="card-interactive" className="!mb-0 group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1">
              {item.title}
            </Heading>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[var(--accent-primary)] transition-colors opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 duration-300 shrink-0" />
          </div>
          <Text variant="muted" className="mb-6 line-clamp-1">
            {subtitle}
          </Text>
        </div>
        
        <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant={isBook ? "outline" : "solid"}>{badgeLabel}</Badge>
            {item.language && item.language !== "Unknown" && (
               <Badge variant="outline" className="opacity-70">{item.language}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isWatchLater ? (
              <>
                <Clock className="w-4 h-4 text-cyan-500" />
                <Text variant="label" className="!tracking-normal text-sm font-bold text-cyan-500">Queued</Text>
              </>
            ) : (
              <>
                <span className="text-amber-500 text-lg leading-none">★</span>
                <Text variant="label" className="!tracking-normal text-sm font-bold">{item.rating}</Text>
              </>
            )}
            
            {/* Quick Toggle Button */}
            {!isBook && process.env.NODE_ENV === "development" && (
              <button 
                onClick={handleToggleStatus}
                disabled={isUpdating}
                className={`ml-2 p-1.5 rounded-md border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-elevated)] transition-colors ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                title={isWatchLater ? "Mark as Watched" : "Move to Watch Later"}
              >
                {isWatchLater ? <span className="text-emerald-500 text-xs font-bold">✓</span> : <Clock className="w-3 h-3 text-[var(--text-muted)]" />}
              </button>
            )}
          </div>
        </div>
      </Card>
    </a>
  );
}
