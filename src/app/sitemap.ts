import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';
import { ListingStatus } from '@/lib/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://toolate-mu.vercel.app';

  // Base static routes
  const staticRoutes = [
    '',
    '/listings',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/tools/rental-agreement',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Fetch all active, approved listings to index dynamic detail pages
  try {
    const listings = await prisma.listing.findMany({
      where: {
        status: ListingStatus.APPROVED,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ],
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    const dynamicRoutes = listings.map((listing) => ({
      url: `${baseUrl}/listings/${listing.id}`,
      lastModified: listing.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...dynamicRoutes];
  } catch (error) {
    console.error('[SEO Error] Failed to generate listings sitemap:', error);
    return staticRoutes;
  }
}
