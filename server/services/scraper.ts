import * as cheerio from 'cheerio';

export interface ProductData {
  title: string;
  price: string;
  images: string[];
  description: string;
  features: string[];
  specifications: Record<string, string>;
  brand?: string;
  category?: string;
}

export class ProductScraper {
  async scrapeProduct(url: string): Promise<ProductData> {
    try {
      // Validate URL
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      
      if (domain.includes('amazon')) {
        return await this.scrapeAmazon(url);
      } else if (domain.includes('aliexpress')) {
        return await this.scrapeAliExpress(url);
      } else if (domain.includes('shopify')) {
        return await this.scrapeShopify(url);
      } else {
        return await this.scrapeGeneric(url);
      }
    } catch (error) {
      throw new Error(`Failed to scrape product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async scrapeAmazon(url: string): Promise<ProductData> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    return {
      title: $('#productTitle').text().trim() || 'Product Title',
      price: $('.a-price-whole').first().text().trim() || '$99',
      images: this.extractImages($, ['#landingImage', '.a-dynamic-image']),
      description: $('#feature-bullets ul').text().trim() || 'Product description',
      features: this.extractFeatures($, '#feature-bullets li span'),
      specifications: this.extractSpecs($, '#productDetails_techSpec_section_1 tr'),
      brand: $('#bylineInfo').text().trim(),
      category: $('.nav-a-content').first().text().trim(),
    };
  }

  private async scrapeAliExpress(url: string): Promise<ProductData> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    return {
      title: $('.product-title-text').text().trim() || 'Product Title',
      price: $('.product-price-value').text().trim() || '$99',
      images: this.extractImages($, ['.magnifier-image img', '.image-thumb img']),
      description: $('.product-description').text().trim() || 'Product description',
      features: this.extractFeatures($, '.product-feature li'),
      specifications: this.extractSpecs($, '.product-specs tr'),
      brand: $('.store-name').text().trim(),
      category: $('.breadcrumb-item').last().text().trim(),
    };
  }

  private async scrapeShopify(url: string): Promise<ProductData> {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    return {
      title: $('.product-single__title, .product__title, h1').first().text().trim() || 'Product Title',
      price: $('.product-single__price, .product__price, .price').first().text().trim() || '$99',
      images: this.extractImages($, ['.product-single__photo img', '.product__photo img']),
      description: $('.product-single__description, .product__description').text().trim() || 'Product description',
      features: this.extractFeatures($, '.product-single__description li'),
      specifications: {},
      brand: $('.product-single__vendor, .product__vendor').text().trim(),
      category: $('.breadcrumb__item').last().text().trim(),
    };
  }

  private async scrapeGeneric(url: string): Promise<ProductData> {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    return {
      title: $('h1').first().text().trim() || $('title').text().trim() || 'Product Title',
      price: $('[class*="price"], [id*="price"]').first().text().trim() || '$99',
      images: this.extractImages($, ['img[src*="product"], img[alt*="product"], .product img']),
      description: $('[class*="description"], [id*="description"]').first().text().trim() || 'Product description',
      features: this.extractFeatures($, 'li'),
      specifications: {},
      brand: $('[class*="brand"], [id*="brand"]').text().trim(),
      category: $('[class*="category"], [id*="category"]').text().trim(),
    };
  }

  private extractImages($: cheerio.CheerioAPI, selectors: string[]): string[] {
    const images: string[] = [];
    
    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src.startsWith('http')) {
          images.push(src);
        }
      });
    }
    
    return Array.from(new Set(images)).slice(0, 5); // Return unique images, max 5
  }

  private extractFeatures($: cheerio.CheerioAPI, selector: string): string[] {
    const features: string[] = [];
    
    $(selector).each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 10 && text.length < 200) {
        features.push(text);
      }
    });
    
    return features.slice(0, 8); // Max 8 features
  }

  private extractSpecs($: cheerio.CheerioAPI, selector: string): Record<string, string> {
    const specs: Record<string, string> = {};
    
    $(selector).each((_, el) => {
      const key = $(el).find('td:first-child, th:first-child').text().trim();
      const value = $(el).find('td:last-child, td:nth-child(2)').text().trim();
      
      if (key && value) {
        specs[key] = value;
      }
    });
    
    return specs;
  }
}
