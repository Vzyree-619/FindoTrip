import { LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const baseUrl = new URL(request.url).origin;
  
  // Static pages
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' },
    { url: '/accommodations', priority: '0.9', changefreq: 'daily' },
    { url: '/car_rentals', priority: '0.8', changefreq: 'weekly' },
    { url: '/tour_guides', priority: '0.8', changefreq: 'weekly' },
    { url: '/about', priority: '0.6', changefreq: 'monthly' },
    { url: '/contact', priority: '0.6', changefreq: 'monthly' },
    { url: '/terms', priority: '0.4', changefreq: 'yearly' },
    { url: '/privacy', priority: '0.4', changefreq: 'yearly' },
    { url: '/login', priority: '0.5', changefreq: 'monthly' },
    { url: '/register', priority: '0.5', changefreq: 'monthly' },
  ];

  try {
    // Get dynamic content
    const [accommodations, cars, tourGuides] = await Promise.all([
      prisma.accommodation.findMany({
        where: { available: true },
        select: { id: true, updatedAt: true, city: true, country: true },
        take: 1000, // Limit for performance
      }),
      prisma.car.findMany({
        where: { available: true },
        select: { id: true, updatedAt: true, city: true, country: true },
        take: 1000,
      }),
      prisma.tourGuide.findMany({
        where: { available: true },
        select: { id: true, updatedAt: true, city: true, country: true },
        take: 1000,
      }),
    ]);

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${staticPages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('')}
  ${accommodations
    .map(
      (accommodation) => `
  <url>
    <loc>${baseUrl}/accommodations/${accommodation.id}</loc>
    <lastmod>${accommodation.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('')}
  ${cars
    .map(
      (car) => `
  <url>
    <loc>${baseUrl}/cars/${car.id}</loc>
    <lastmod>${car.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
    )
    .join('')}
  ${tourGuides
    .map(
      (guide) => `
  <url>
    <loc>${baseUrl}/tour-guides/${guide.id}</loc>
    <lastmod>${guide.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
    )
    .join('')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return basic sitemap on error
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('')}
</urlset>`;

    return new Response(basicSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes on error
      },
    });
  }
}
