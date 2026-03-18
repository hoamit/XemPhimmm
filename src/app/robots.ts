import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/player/',
    },
    sitemap: 'https://xemphimmm.vercel.app/sitemap.xml',
  };
}
