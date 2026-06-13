import prisma from './prisma';
import { redis } from './redis';

export interface SiteSettings {
  id: string;
  heroTitle: string;
  heroSubtitle: string;
  footerText: string;
  metaTitle: string;
  metaDescription: string;
  adsenseId: string;
  maintenanceMode: boolean;
  updatedAt: Date;
  helpEmail: string;
  officeAddress: string;
  supportEmail: string;
  supportPhone: string;
  whatsappSupport: string;
}

const CACHE_KEY = 'site-settings:default';

export async function getCachedSettings(): Promise<SiteSettings | null> {
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }
  } catch (err) {
    console.warn('[Redis Warning] Failed to read site settings cache:', err);
  }

  try {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: 'default' },
      });
    }

    try {
      await redis.set(CACHE_KEY, JSON.stringify(settings), { ex: 3600 }); // cache for 1 hour
    } catch (err) {
      console.warn('[Redis Warning] Failed to write site settings cache:', err);
    }

    return settings as unknown as SiteSettings;
  } catch (error) {
    console.error('[Database Error] Failed to fetch site settings:', error);
    return null;
  }
}

export async function invalidateSettingsCache(): Promise<void> {
  try {
    await redis.del(CACHE_KEY);
  } catch (err) {
    console.warn('[Redis Warning] Failed to invalidate site settings cache:', err);
  }
}
