import { GeneratedContent } from "./ai";
import { ProductData } from "./scraper";

export interface ShopifyStoreConfig {
  storeName: string;
  subdomain: string;
  theme: string;
  currency: string;
  timezone: string;
  market: string;
  style?: string;
}

export interface ShopifyProduct {
  title: string;
  description: string;
  vendor: string;
  productType: string;
  variants: Array<{
    title: string;
    price: string;
    sku: string;
    inventory: number;
  }>;
  images: Array<{
    src: string;
    alt: string;
  }>;
  tags: string[];
  seo: {
    title: string;
    description: string;
  };
}

export interface MockStore {
  id: string;
  name: string;
  url: string;
  adminUrl: string;
  status: 'development' | 'live';
  product: ShopifyProduct;
  theme: any;
  settings: ShopifyStoreConfig;
}

export class ShopifyService {
  private apiKey = process.env.SHOPIFY_PARTNER_API_KEY;
  private apiSecret = process.env.SHOPIFY_PARTNER_API_SECRET;
  private orgId = process.env.SHOPIFY_PARTNER_ORG_ID;

  private async makeGraphQLRequest(query: string, variables: any = {}) {
    if (!this.apiKey || !this.apiSecret || !this.orgId) {
      throw new Error('Shopify Partner API credentials not configured');
    }

    const response = await fetch(`https://partners.shopify.com/${this.orgId}/api/2025-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.apiSecret,
      },
      body: JSON.stringify({
        query,
        variables
      }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; error?: string; data?: any }> {
    if (!this.apiKey || !this.apiSecret || !this.orgId) {
      return {
        success: false,
        error: 'Missing Shopify Partner API credentials'
      };
    }

    try {
      const response = await fetch(`https://partners.shopify.com/${this.orgId}/api/2025-04/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.apiSecret,
        },
        body: JSON.stringify({
          query: `
            query {
              transactions(first: 1) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          `
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText} - ${errorText}`
        };
      }

      const data = await response.json();
      
      if (data.errors) {
        return {
          success: false,
          error: `GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`
        };
      }

      return {
        success: true,
        data: {
          message: "Partner API connection successful!",
          organizationId: this.orgId,
          capabilities: [
            "✅ Partner API authenticated",
            "✅ Can access partner data and financial information",
            "❌ Development store creation requires manual Partner Dashboard process",
            "✅ Can configure stores after manual creation via Admin API"
          ],
          nextSteps: [
            "Create development stores manually in Partner Dashboard",
            "Use Admin API to configure stores programmatically", 
            "Transfer completed stores to customers"
          ]
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async createDevelopmentStore(
    productData: ProductData,
    content: GeneratedContent,
    config: Partial<ShopifyStoreConfig>
  ): Promise<MockStore> {
    const subdomain = config.storeName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 
                     content.brandName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    try {
      // Create development store using Shopify Partner API
      const createStoreQuery = `
        mutation appDevelopmentStoreCreate($input: AppDevelopmentStoreInput!) {
          appDevelopmentStoreCreate(input: $input) {
            appDevelopmentStore {
              id
              name
              myshopifyDomain
              url
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const storeInput = {
        name: content.brandName,
        transferDisabled: false,
        buildForTheme: true
      };

      const result = await this.makeGraphQLRequest(createStoreQuery, {
        input: storeInput
      });

      if (result.data?.appDevelopmentStoreCreate?.userErrors?.length > 0) {
        console.error('Shopify API errors:', result.data.appDevelopmentStoreCreate.userErrors);
        throw new Error(`Store creation failed: ${result.data.appDevelopmentStoreCreate.userErrors[0].message}`);
      }

      const shopifyStore = result.data?.appDevelopmentStoreCreate?.appDevelopmentStore;
      
      if (!shopifyStore) {
        throw new Error('Failed to create development store');
      }

      const store: MockStore = {
        id: shopifyStore.id,
        name: shopifyStore.name,
        url: `https://${shopifyStore.myshopifyDomain}`,
        adminUrl: `https://${shopifyStore.myshopifyDomain}/admin`,
        status: 'development',
        product: this.createShopifyProduct(productData, content),
        theme: this.generateTheme(content),
        settings: {
          storeName: shopifyStore.name,
          subdomain: shopifyStore.myshopifyDomain,
          theme: 'modern-ecommerce',
          currency: config.currency || 'USD',
          timezone: 'America/New_York',
          market: config.market || 'US',
        }
      };

      return store;

    } catch (error) {
      console.error('Shopify Partner API Error:', error);
      // Fallback to mock store for demo purposes
      const storeId = `dev_${Date.now()}`;
    
      const store: MockStore = {
        id: storeId,
        name: content.brandName,
        url: `https://${subdomain}.myshopify.com`,
        adminUrl: `https://${subdomain}.myshopify.com/admin`,
        status: 'development',
        product: this.createShopifyProduct(productData, content),
        theme: this.generateTheme(content),
        settings: {
          storeName: content.brandName,
          subdomain: subdomain,
          theme: config.theme || 'modern-ecommerce',
          currency: config.currency || 'USD',
          timezone: 'America/New_York',
          market: config.market || 'US',
          style: config.style || 'Modern Minimal'
        }
      };

      // Simulate async store setup
      await this.setupStore(store);
      
      return store;
    }
  }

  private createShopifyProduct(productData: ProductData, content: GeneratedContent): ShopifyProduct {
    return {
      title: content.productTitle,
      description: content.productDescription,
      vendor: content.brandName,
      productType: productData.category || 'General',
      variants: [
        {
          title: 'Default',
          price: productData.price.replace(/[^0-9.]/g, ''),
          sku: `SKU-${Date.now()}`,
          inventory: 100,
        }
      ],
      images: content.generatedImages.map(img => ({
        src: img,
        alt: content.productTitle,
      })),
      tags: this.generateTags(productData, content),
      seo: {
        title: content.metaDescription,
        description: content.metaDescription,
      }
    };
  }

  private generateTheme(content: GeneratedContent) {
    // Check if premium theme data is available
    const premiumTheme = (content as any).premiumTheme;
    
    if (premiumTheme) {
      return {
        name: `${premiumTheme.theme} (${premiumTheme.style.primary})`,
        style: premiumTheme.style.primary,
        shopifyTheme: premiumTheme.theme,
        confidence: premiumTheme.style.confidence,
        settings: {
          colors: {
            primary: premiumTheme.palette.primary,
            accent1: premiumTheme.palette.accent_1,
            accent2: premiumTheme.palette.accent_2,
            background: premiumTheme.palette.background
          },
          typography: {
            headingFont: premiumTheme.typography.heading,
            bodyFont: premiumTheme.typography.body,
          },
          tone: premiumTheme.tone,
          layout: {
            maxWidth: '1200px',
            headerStyle: this.getHeaderStyle(premiumTheme.style.primary),
            footerStyle: this.getFooterStyle(premiumTheme.style.primary),
            sections: premiumTheme.layout.pdp_order
          },
          sections: {
            hero: {
              enabled: true,
              headline: premiumTheme.copy.hero.headline,
              subheadline: premiumTheme.copy.hero.subhead,
              ctaText: premiumTheme.copy.hero.cta,
            },
            features: {
              enabled: true,
              features: premiumTheme.copy.bullets,
            },
            description: {
              enabled: true,
              content: premiumTheme.copy.description
            },
            specifications: {
              enabled: true,
              specs: premiumTheme.copy.specs
            },
            faq: {
              enabled: true,
              faqs: premiumTheme.copy.faq.map((item: any) => ({
                question: item.q,
                answer: item.a
              }))
            },
            trustBadges: {
              enabled: true,
              badges: premiumTheme.proof.badges
            }
          },
          images: {
            heroPrompt: premiumTheme.images.hero_prompt,
            galleryPrompts: premiumTheme.images.gallery_prompts,
            detailPrompts: premiumTheme.images.detail_prompts
          }
        }
      };
    }

    // Fallback to basic theme
    return {
      name: 'AI Generated Theme',
      settings: {
        colors: content.brandColors,
        typography: {
          headingFont: 'Inter',
          bodyFont: 'Inter',
        },
        layout: {
          maxWidth: '1200px',
          headerStyle: 'modern',
          footerStyle: 'minimal',
        },
        sections: {
          hero: {
            enabled: true,
            headline: content.heroHeadline,
            subheadline: content.heroSubheadline,
            ctaText: content.callToAction,
          },
          features: {
            enabled: true,
            features: content.features,
          },
          testimonials: {
            enabled: true,
          },
          faq: {
            enabled: true,
            faqs: content.faqs,
          }
        }
      }
    };
  }

  private getHeaderStyle(styleClass: string): string {
    const headerStyles: Record<string, string> = {
      "Modern Minimal": "clean",
      "Cozy Natural": "warm",
      "Tech Futuristic": "minimal",
      "Sport Performance": "bold",
      "Luxury Elegant": "sophisticated",
      "Street Utility": "industrial",
      "Playful Colorful": "fun",
      "Eco Rustic": "organic",
      "Professional Clean": "corporate",
      "Beauty Wellness": "elegant",
      "Kitchen Home": "practical",
      "Pets Friendly": "friendly"
    };
    return headerStyles[styleClass] || "modern";
  }

  private getFooterStyle(styleClass: string): string {
    const footerStyles: Record<string, string> = {
      "Modern Minimal": "minimal",
      "Cozy Natural": "cozy",
      "Tech Futuristic": "sleek",
      "Sport Performance": "compact",
      "Luxury Elegant": "refined",
      "Street Utility": "utilitarian",
      "Playful Colorful": "vibrant",
      "Eco Rustic": "natural",
      "Professional Clean": "structured",
      "Beauty Wellness": "serene",
      "Kitchen Home": "informative",
      "Pets Friendly": "welcoming"
    };
    return footerStyles[styleClass] || "minimal";
  }

  private generateTags(productData: ProductData, content: GeneratedContent): string[] {
    const tags = [];
    
    if (productData.brand) tags.push(productData.brand);
    if (productData.category) tags.push(productData.category);
    
    // Add feature-based tags
    content.features.forEach(feature => {
      const words = feature.split(' ').filter(word => word.length > 3);
      tags.push(...words.slice(0, 2));
    });
    
    return Array.from(new Set(tags)).slice(0, 10);
  }

  private async setupStore(store: MockStore): Promise<void> {
    // Simulate store setup tasks
    await this.delay(1000); // Theme installation
    await this.delay(500);  // Product creation
    await this.delay(500);  // Pages setup
    await this.delay(300);  // Payment config
  }

  async transferStore(storeId: string, ownerEmail: string): Promise<{ success: boolean; transferUrl?: string }> {
    // Simulate store transfer process
    await this.delay(2000);
    
    return {
      success: true,
      transferUrl: `https://partners.shopify.com/organizations/transfer/${storeId}?email=${encodeURIComponent(ownerEmail)}`
    };
  }

  async updateStoreStatus(storeId: string, status: 'development' | 'live'): Promise<boolean> {
    // Simulate status update
    await this.delay(500);
    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
