import { fetchWithTimeout } from './fetcher';

const DEV_TO_USERNAME = "ajay_dharmaraj";

export async function getDevToArticles() {
  try {
    // We use next data cache to revalidate every hour
    const res = await fetchWithTimeout(`https://dev.to/api/articles?username=${DEV_TO_USERNAME}&state=all`, {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching Dev.to articles:", error);
    return [];
  }
}

export async function getDevToArticle(slug: string) {
  try {
    const res = await fetchWithTimeout(`https://dev.to/api/articles/${DEV_TO_USERNAME}/${slug}`, {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error(`Error fetching Dev.to article ${slug}:`, error);
    return null;
  }
}
