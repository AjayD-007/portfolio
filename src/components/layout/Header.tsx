"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Typography";

export function Header() {
  const pathname = usePathname();
  const [viewCount, setViewCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/views', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.views) setViewCount(data.views);
      })
      .catch((err) => console.error('Error fetching views:', err));
  }, []);

  const isImmersivePage = pathname === '/math/non-euclidean-world' || pathname === '/math/fractals' || pathname === '/math/equation-evolver' || pathname === '/math/llm/micronet';

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Blogs", href: "/blogs" },
    { name: "Math", href: "/math" },
  ];

  return (
    <header className={`w-full z-50 pt-6 pointer-events-auto ${isImmersivePage ? 'fixed top-0 left-0' : 'relative'}`}>
      <Container maxWidth="7xl">
        <Card variant="nav">
          <div className="flex items-center gap-6 md:gap-8">
            <Link href="/" className="block">
              <Image src="/logo.png" alt="AD Logo" width={40} height={40} className="rounded-lg" priority />
            </Link>
            <nav className="flex items-center gap-4 md:gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`transition-colors ${
                    pathname === link.href 
                      ? "text-black dark:text-white" 
                      : "text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  <Text variant="label" className="!font-bold">{link.name}</Text>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            {viewCount !== null ? (
              <div
                className="flex items-center gap-2 text-sm font-medium text-black dark:text-white bg-black/5 dark:bg-white/10 backdrop-blur-md px-3 md:px-4 py-2.5 md:py-3 rounded-full border border-black/10 dark:border-white/20 transition-all duration-500 animate-in fade-in zoom-in-95 hover:scale-105"
                title="Unique Views"
              >
                <Eye size={20} />
                <span>{viewCount.toLocaleString()}</span>
              </div>
            ) : (
               <div
                className="flex items-center gap-2 text-sm font-medium text-black/20 dark:text-white/20 bg-black/5 dark:bg-white/10 backdrop-blur-md px-3 md:px-4 py-2.5 md:py-3 rounded-full border border-black/10 dark:border-white/20 animate-pulse"
                aria-hidden="true"
              >
                <Eye size={20} />
                <span className="opacity-0">0,000</span>
              </div>
            )}
            <ThemeToggle />
          </div>
        </Card>
      </Container>
    </header>
  );
}
