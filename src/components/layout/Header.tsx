"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Blogs", href: "/blogs" },
  ];

  return (
    <header className="relative w-full z-50 px-4 md:px-6 pt-6 pb-2 mb-8 pointer-events-auto">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 p-4 rounded-2xl shadow-xl shadow-black/5">
          <div className="flex items-center gap-6 md:gap-8">
            <Link 
              href="/" 
              className="text-xl md:text-2xl font-black tracking-tighter"
            >
              AD
            </Link>
            <nav className="flex items-center gap-4 md:gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-xs md:text-sm font-bold tracking-widest uppercase transition-colors ${
                    pathname === link.href 
                      ? "text-black dark:text-white" 
                      : "text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
