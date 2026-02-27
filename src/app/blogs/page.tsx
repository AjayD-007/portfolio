import { GlassCard } from "@/components/GlassCard";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Writings | Ajay - Frontend & Design",
  description: "Thoughts, tutorials, and experiments exploring frontend engineering and design.",
};

// ----------------------------------------------------
// UPDATE THIS TO YOUR DEV.TO USERNAME
// E.g., "ajaydharmaraj", "leerob", "devteam"
// ----------------------------------------------------
const DEV_TO_USERNAME = "ajay_dharmaraj";

// Next.js ISR: Re-fetch the Dev.to API every 1 hour in the background
// This means no redeploys needed when you publish a new article!
export const revalidate = 3600;

async function getPosts() {
  try {
    // We only fetch a minimal payload for the index page to stay fast
    const res = await fetch(`https://dev.to/api/articles?username=${DEV_TO_USERNAME}`);
    if (!res.ok) return [];
    
    // The dev.to API returns an array of article objects
    return await res.json();
  } catch (error) {
    console.error("Error fetching Dev.to articles:", error);
    return [];
  }
}

export default async function BlogsPage() {
  const blogs = await getPosts();

  return (
    <div className="relative container mx-auto px-6 md:px-12 py-12 md:py-24 z-10 flex-grow">
      
      <div className="mb-16">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 uppercase leading-none">
          Writings
        </h1>
        <p className="text-xl md:text-2xl text-gray-900 dark:text-gray-400 font-medium max-w-2xl">
          Thoughts, tutorials, and experiments exploring frontend engineering and design.
        </p>
      </div>

      {blogs.length === 0 ? (
        <div className="text-xl font-mono text-gray-500">No articles found for @{DEV_TO_USERNAME} yet...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog: any, i: number) => (
            <Link key={blog.id} href={`/blogs/${blog.slug}`} className="h-full">
              <GlassCard delay={0.1 * i} className="flex flex-col h-full hover:scale-105 transition-transform duration-500 cursor-pointer">
                <span className="text-sm font-mono font-bold text-gray-500 dark:text-gray-400 mb-4 tracking-widest uppercase">
                  {new Date(blog.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <h3 className="text-2xl font-black mb-4 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {blog.title}
                </h3>
                <p className="text-gray-800 dark:text-gray-300 leading-relaxed font-medium mt-auto">
                  {blog.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {blog.tag_list.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="text-xs font-mono px-2 py-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
