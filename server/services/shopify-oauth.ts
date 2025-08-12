import crypto from 'crypto';
import { storage } from '../storage';

// Shopify OAuth configuration
const SHOPIFY_API_VERSION = '2024-01';

export class ShopifyOAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly scopes: string[];
  private readonly redirectUri: string;

  constructor() {
    // These will be set via environment variables
    this.clientId = process.env.SHOPIFY_CLIENT_ID || '';
    this.clientSecret = process.env.SHOPIFY_CLIENT_SECRET || '';
    this.redirectUri = process.env.SHOPIFY_REDIRECT_URI || 'https://yourdomain.com/api/shopify/callback';
    
    // Scopes needed for store setup
    this.scopes = [
      'write_products',
      'write_themes',
      'write_content',
      'write_metaobjects',
      'write_online_store_pages',
      'write_script_tags',
      'read_analytics',
    ];
  }

  /**
   * Generate OAuth authorization URL for shop
   */
  generateAuthUrl(shop: string, state: string): string {
    const shopDomain = this.normalizeShopDomain(shop);
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: this.scopes.join(','),
      redirect_uri: this.redirectUri,
      state: state,
    });
    
    return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(shop: string, code: string): Promise<{ accessToken: string; scope: string }> {
    const shopDomain = this.normalizeShopDomain(shop);
    
    const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      scope: data.scope,
    };
  }

  /**
   * Verify webhook HMAC
   */
  verifyWebhookHmac(rawBody: string, hmacHeader: string): boolean {
    const hash = crypto
      .createHmac('sha256', this.clientSecret)
      .update(rawBody, 'utf8')
      .digest('base64');
    
    return hash === hmacHeader;
  }

  /**
   * Verify request signature (for OAuth callback)
   */
  verifyRequestSignature(query: Record<string, string>): boolean {
    const { hmac, ...params } = query;
    if (!hmac) return false;

    const message = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const generatedHmac = crypto
      .createHmac('sha256', this.clientSecret)
      .update(message)
      .digest('hex');

    return generatedHmac === hmac;
  }

  /**
   * Create Shopify API client for authenticated requests
   */
  createApiClient(shop: string, accessToken: string) {
    const shopDomain = this.normalizeShopDomain(shop);
    
    const apiClient = {
      request: async (endpoint: string, options: RequestInit = {}) => {
        const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}${endpoint}`;
        const response = await fetch(url, {
          ...options,
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Shopify API error: ${response.status} - ${error}`);
        }

        return response.json();
      },
      
      // Helper methods for common operations
      getShop: async () => {
        return await apiClient.request('/shop.json');
      },
      
      createProduct: async (productData: any) => {
        return await apiClient.request('/products.json', {
          method: 'POST',
          body: JSON.stringify({ product: productData }),
        });
      },
      
      updateTheme: async (themeId: string, assets: any[]) => {
        // Update theme assets
        for (const asset of assets) {
          await apiClient.request(`/themes/${themeId}/assets.json`, {
            method: 'PUT',
            body: JSON.stringify({ asset }),
          });
        }
      },
    };
    
    return apiClient;
  }

  /**
   * Normalize shop domain
   */
  private normalizeShopDomain(shop: string): string {
    // Remove protocol if present
    shop = shop.replace(/^https?:\/\//, '');
    
    // Add .myshopify.com if not present
    if (!shop.includes('.myshopify.com')) {
      shop = `${shop}.myshopify.com`;
    }
    
    return shop;
  }

  /**
   * Generate secure random state for OAuth
   */
  generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export const shopifyOAuth = new ShopifyOAuthService();