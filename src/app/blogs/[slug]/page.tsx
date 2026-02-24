import Link from "next/link";
import { notFound } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";

const DEV_TO_USERNAME = "ajay_dharmaraj";

export const revalidate = 3600; // ISR cache revalidation

// Static Site Generation setup
export async function generateStaticParams() {
  const res = await fetch(`https://dev.to/api/articles?username=${DEV_TO_USERNAME}`);
  if (!res.ok) return [];
  const posts = await res.json();

  return posts.map((post: any) => ({
    slug: post.slug,
  }));
}

async function getArticle(slug: string) {
  try {
    const res = await fetch(`https://dev.to/api/articles/${DEV_TO_USERNAME}/${slug}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const parsedParams = await params;
  const article = await getArticle(parsedParams.slug);

  if (!article) {
    notFound();
  }

  return (
    <article className="relative container mx-auto px-6 md:px-12 py-12 md:py-24 z-10 flex-grow max-w-4xl">
      <div className="mb-12">
        <Link 
          href="/blogs" 
          className="inline-flex items-center text-sm font-mono font-bold tracking-widest uppercase text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors mb-8"
        >
          &larr; Back to Writings
        </Link>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-tight">
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm font-mono font-bold text-gray-600 dark:text-gray-400 tracking-widest uppercase">
          <span>{new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span>•</span>
          <span>{article.reading_time_minutes} min read</span>
        </div>
      </div>

      <GlassCard className="prose prose-lg dark:prose-invert max-w-none bg-white/60 dark:bg-black/40 backdrop-blur-xl p-8 md:p-12 rounded-3xl" delay={0.1}>
        {/* Render the sanitized HTML returned by Dev.to directly */}
        <div 
          dangerouslySetInnerHTML={{ __html: article.body_html }} 
          className="article-content"
        />
      </GlassCard>

      {/* Basic styles to make the external HTML look decent */}
      <style dangerouslySetInnerHTML={{__html: `
        .article-content img { border-radius: 12px; margin: 2rem auto; }
        .article-content a { color: #d97706; text-decoration: none; font-weight: 600; }
        .article-content a:hover { text-decoration: underline; }
        .article-content h2 { font-weight: 900; margin-top: 3rem; margin-bottom: 1.5rem; font-size: 2rem; }
        .article-content h3 { font-weight: 800; margin-top: 2rem; margin-bottom: 1rem; font-size: 1.5rem; }
        .article-content pre { background: rgba(0,0,0,0.8) !important; color: white !important; padding: 1.5rem !important; border-radius: 12px !important; overflow-x: auto !important; margin: 2rem 0 !important; }
        .article-content code { background: rgba(128,128,128,0.2); padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
        .article-content pre code { background: transparent; padding: 0; border-radius: 0; }
        .article-content blockquote { border-left: 4px solid #d97706; padding-left: 1rem; margin-left: 0; font-style: italic; color: #6b7280; }
        .dark .article-content blockquote { color: #9ca3af; }
        .article-content p { margin-bottom: 1.5rem; line-height: 1.8; }
        .article-content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1.5rem; }
        .article-content ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 1.5rem; }
        .article-content li { margin-bottom: 0.5rem; }
        
        /* Hide Dev.to injected interactive SVGs that lack runtime JS/CSS */
        .article-content .highlight .action-button,
        .article-content .highlight .fullscreen-button,
        .article-content .highlight svg { display: none !important; }
      `}} />
    </article>
  );
}
