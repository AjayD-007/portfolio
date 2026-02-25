import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { resumeData } from "@/data/resume";

export const metadata: Metadata = {
  title: `${resumeData.title} | ${resumeData.subtitle}`,
  description: resumeData.about.description,
  keywords: ["Software Engineer", "Full Stack", "Portfolio", "WebGL", "Three.js", "React", "Next.js"],
  authors: [{ name: resumeData.title }],
  creator: resumeData.title,
  openGraph: {
    title: `${resumeData.title} | ${resumeData.subtitle}`,
    description: resumeData.about.description,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F8F9FA] dark:bg-[#050505] text-black dark:text-white transition-colors duration-500`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="flex flex-col min-h-screen pb-8">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
