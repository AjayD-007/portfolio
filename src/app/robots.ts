import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/api/',
      }
    ],
    sitemap: 'https://ajay-dharmaraj.vercel.app/sitemap.xml',
  }
}
