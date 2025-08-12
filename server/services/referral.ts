import crypto from 'crypto';
import { storage } from '../storage';
import type { Referral, Project } from '@shared/schema';

export class ReferralService {
  private readonly partnerOrgId: string;
  
  constructor() {
    // Your Shopify Partner Organization ID
    this.partnerOrgId = process.env.SHOPIFY_PARTNER_ORG_ID || '4441682';
  }

  /**
   * Generate a unique referral code for tracking
   */
  generateReferralCode(): string {
    // Generate a unique, URL-safe code
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Create a referral link for Shopify signup
   */
  async createReferralLink(
    projectId: string, 
    userId: string,
    suggestedStoreName?: string,
    customerEmail?: string
  ): Promise<{ referralUrl: string; referral: Referral }> {
    // Generate unique referral code
    const referralCode = this.generateReferralCode();
    
    // Save referral to database
    const referral = await storage.createReferral({
      userId,
      projectId,
      referralCode,
      customerEmail,
      status: 'pending',
    });

    // Build Shopify Partner referral URL
    const baseUrl = 'https://partners.shopify.com/signup';
    const params = new URLSearchParams({
      'ref': this.partnerOrgId, // Your partner organization ID
      'return_url': `${process.env.APP_URL || 'https://yourdomain.com'}/api/shopify/oauth/begin?code=${referralCode}`,
    });

    // Add optional parameters
    if (suggestedStoreName) {
      params.append('shop_name', this.sanitizeStoreName(suggestedStoreName));
    }
    if (customerEmail) {
      params.append('email', customerEmail);
    }

    const referralUrl = `${baseUrl}?${params.toString()}`;
    
    return { referralUrl, referral };
  }

  /**
   * Track when a referral link is clicked
   */
  async trackReferralClick(referralCode: string): Promise<Referral | null> {
    const referral = await storage.getReferralByCode(referralCode);
    if (!referral) return null;

    return await storage.updateReferral(referral.id, {
      status: 'clicked',
      clickedAt: new Date(),
    });
  }

  /**
   * Mark referral as converted when OAuth completes
   */
  async markReferralConverted(
    referralCode: string, 
    shopifyStoreId: string
  ): Promise<Referral | null> {
    const referral = await storage.getReferralByCode(referralCode);
    if (!referral) return null;

    return await storage.updateReferral(referral.id, {
      status: 'converted',
      convertedAt: new Date(),
      shopifyStoreId,
    });
  }

  /**
   * Calculate commission based on Shopify plan
   */
  calculateMonthlyCommission(shopifyPlan: string): number {
    const commissionRates: Record<string, number> = {
      'basic': 780, // $39 * 0.20 = $7.80 (in cents)
      'shopify': 2100, // $105 * 0.20 = $21.00
      'advanced': 7980, // $399 * 0.20 = $79.80
      'plus': 40000, // $2000 * 0.20 = $400.00 (estimate)
    };

    return commissionRates[shopifyPlan.toLowerCase()] || 0;
  }

  /**
   * Get referral statistics for a user
   */
  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    pendingReferrals: number;
    convertedReferrals: number;
    estimatedMonthlyRevenue: number;
  }> {
    const referrals = await storage.getReferralsByUser(userId);
    const stores = await storage.getShopifyStoresByUser(userId);
    
    const totalReferrals = referrals.length;
    const pendingReferrals = referrals.filter(r => r.status === 'pending' || r.status === 'clicked').length;
    const convertedReferrals = referrals.filter(r => r.status === 'converted').length;
    
    // Calculate estimated monthly revenue from all active stores
    const estimatedMonthlyRevenue = stores
      .filter(store => store.isActive && store.monthlyCommission)
      .reduce((total, store) => total + (store.monthlyCommission || 0), 0);

    return {
      totalReferrals,
      pendingReferrals,
      convertedReferrals,
      estimatedMonthlyRevenue,
    };
  }

  /**
   * Sanitize store name for URL
   */
  private sanitizeStoreName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60); // Shopify limit
  }

  /**
   * Generate smart store name suggestions from product data
   */
  generateStoreNameSuggestions(productData: any): string[] {
    const suggestions: string[] = [];
    
    // Extract keywords from product
    const brandName = productData.generatedContent?.brandName || productData.brand || '';
    const category = productData.category || '';
    const title = productData.title || '';
    
    // Generate variations
    if (brandName) {
      suggestions.push(this.sanitizeStoreName(brandName));
      suggestions.push(this.sanitizeStoreName(`${brandName}-shop`));
      suggestions.push(this.sanitizeStoreName(`${brandName}-store`));
    }
    
    // Add category-based suggestions
    if (category) {
      suggestions.push(this.sanitizeStoreName(`the-${category}-shop`));
      suggestions.push(this.sanitizeStoreName(`${category}-central`));
    }
    
    // Add unique variations
    const random = Math.random().toString(36).substring(7);
    suggestions.push(this.sanitizeStoreName(`shop-${random}`));
    
    // Return unique suggestions
    return [...new Set(suggestions)].slice(0, 5);
  }
}

export const referralService = new ReferralService();