import { MetadataRoute } from 'next'

// Using the DEV_TO_USERNAME used in blogs page
const DEV_TO_USERNAME = "ajay_dharmaraj";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ajay-dharmaraj.vercel.app';
  
  let blogUrls: MetadataRoute.Sitemap = [];
  
  try {
    const res = await fetch(`https://dev.to/api/articles?username=${DEV_TO_USERNAME}&state=all`);
    if (res.ok) {
      const posts = await res.json();
      blogUrls = posts.map((post: any) => ({
        url: `${baseUrl}/blogs/${post.slug}`,
        lastModified: new Date(post.published_at),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error("Error fetching Dev.to articles for sitemap:", error);
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...blogUrls,
  ]
}
