import OpenAI from "openai";
import { ProductData } from "./scraper";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

// Premium API instance for theme generation
const premiumOpenai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY_PREMIUM || process.env.OPENAI_API_KEY || "default_key" 
});

// DALL-E 3 COMPLETELY REMOVED - Never use AI image generation
// const imageOpenai = new OpenAI({ 
//   apiKey: process.env.OPENAI_API_KEY_IMAGES || process.env.OPENAI_API_KEY || "default_key" 
// });

export interface GeneratedContent {
  productTitle: string;
  productTitleVariants: string[];
  productDescription: string;
  features: string[];
  faqs: Array<{ question: string; answer: string }>;
  metaDescription: string;
  brandName: string;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  heroHeadline: string;
  heroSubheadline: string;
  callToAction: string;
  generatedImages: string[]; // URLs to AI-generated product images
}

export interface PremiumThemeInputs {
  product_url: string;
  product_title: string;
  product_category: string;
  raw_text: string;
  image_captions: string[];
  target_market: string; // Country code
  currency: string;
}

export interface PremiumThemeDesign {
  blocked: boolean;
  blocked_reason: string;
  style: {
    primary: string;
    secondary: string;
    confidence: number;
  };
  theme: string;
  palette: {
    primary: string;
    accent_1: string;
    accent_2: string;
    background: string;
  };
  typography: {
    heading: string;
    body: string;
  };
  tone: string;
  copy: {
    hero: {
      headline: string;
      subhead: string;
      cta: string;
    };
    bullets: string[];
    description: string;
    specs: string[];
    faq: Array<{
      q: string;
      a: string;
    }>;
  };
  images: {
    hero_prompt: string;
    gallery_prompts: string[];
    detail_prompts: string[];
  };
  layout: {
    pdp_order: string[];
  };
  proof: {
    badges: string[];
  };
}

export class AIContentGenerator {
  async generateStoreContent(productData: ProductData, targetMarket: string = "US"): Promise<GeneratedContent> {
    try {
      const prompt = `
        Create comprehensive e-commerce store content for this product:
        
        Product Title: ${productData.title}
        Price: ${productData.price}
        Description: ${productData.description}
        Features: ${productData.features.join(', ')}
        Brand: ${productData.brand || 'Generic'}
        Target Market: ${targetMarket}
        
        Generate content optimized for conversions and SEO. Respond with JSON in this exact format:
        {
          "productTitle": "Optimized product title (max 60 chars)",
          "productTitleVariants": ["variant1", "variant2", "variant3"],
          "productDescription": "Compelling 120-180 word description focusing on benefits",
          "features": ["5 benefit-focused bullet points in second person"],
          "faqs": [
            {"question": "shipping question", "answer": "detailed answer"},
            {"question": "returns question", "answer": "detailed answer"},
            {"question": "compatibility question", "answer": "detailed answer"},
            {"question": "warranty question", "answer": "detailed answer"}
          ],
          "metaDescription": "SEO meta description (max 155 chars)",
          "brandName": "Memorable brand name for this product",
          "brandColors": {
            "primary": "#6366f1",
            "secondary": "#3b82f6", 
            "accent": "#8b5cf6"
          },
          "heroHeadline": "Compelling headline that hooks attention",
          "heroSubheadline": "Supporting text that builds desire",
          "callToAction": "Action-oriented CTA text"
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert e-commerce copywriter and brand strategist. Create compelling, conversion-focused content that follows e-commerce best practices. Avoid medical claims or exaggerated promises."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = JSON.parse(response.choices[0].message.content!);
      
      // Generate high-quality product images
      // DALL-E 3 DISABLED: Never generate AI images - only use authentic originals
      const generatedImages: string[] = []; // Always empty - use original images only
      
      // Validate and set defaults if needed
      return {
        productTitle: content.productTitle || productData.title,
        productTitleVariants: content.productTitleVariants || [productData.title],
        productDescription: content.productDescription || productData.description,
        features: content.features || productData.features.slice(0, 5),
        faqs: content.faqs || this.getDefaultFAQs(),
        metaDescription: content.metaDescription || `Buy ${content.productTitle} with fast shipping and great customer service.`,
        brandName: content.brandName || productData.brand || "Premium Store",
        brandColors: content.brandColors || {
          primary: "#6366f1",
          secondary: "#3b82f6",
          accent: "#8b5cf6"
        },
        heroHeadline: content.heroHeadline || `Transform Your Life with ${content.productTitle}`,
        heroSubheadline: content.heroSubheadline || "Premium quality, unbeatable value, fast delivery.",
        callToAction: content.callToAction || "Order Now",
        generatedImages: generatedImages
      };
    } catch (error) {
      console.error('AI content generation failed:', error);
      
      // Return fallback content
      return this.getFallbackContent(productData);
    }
  }

  async generatePremiumTheme(inputs: PremiumThemeInputs): Promise<PremiumThemeDesign> {
    try {
      // Style class mapping
      const styleMapping = {
        "Modern Minimal": "Dawn",
        "Cozy Natural": "Origin", 
        "Tech Futuristic": "Taste",
        "Sport Performance": "Ride",
        "Luxury Elegant": "Studio",
        "Street Utility": "Origin",
        "Playful Colorful": "Colorblock",
        "Eco Rustic": "Origin",
        "Professional Clean": "Refresh",
        "Beauty Wellness": "Sense",
        "Kitchen Home": "Crave",
        "Pets Friendly": "Taste"
      };

      // Typography mapping
      const typographyMapping = {
        "Modern Minimal": { heading: "Geometric Sans", body: "System Sans" },
        "Cozy Natural": { heading: "Serif", body: "Sans Serif" },
        "Tech Futuristic": { heading: "Futura", body: "Geometric Sans" },
        "Sport Performance": { heading: "Impact", body: "Sans Serif" },
        "Luxury Elegant": { heading: "Serif", body: "Sans Serif" },
        "Street Utility": { heading: "Bold Sans", body: "Sans Serif" },
        "Playful Colorful": { heading: "Rounded Sans", body: "Rounded Sans" },
        "Eco Rustic": { heading: "Slab Serif", body: "Sans Serif" },
        "Professional Clean": { heading: "Sans Serif", body: "Sans Serif" },
        "Beauty Wellness": { heading: "Script", body: "Sans Serif" },
        "Kitchen Home": { heading: "Serif", body: "Sans Serif" },
        "Pets Friendly": { heading: "Rounded Sans", body: "Sans Serif" }
      };

      // Tone mapping
      const toneMapping = {
        "Modern Minimal": "Short and direct",
        "Cozy Natural": "Warm and simple",
        "Tech Futuristic": "Spec-first and precise",
        "Sport Performance": "Energetic and motivating",
        "Luxury Elegant": "Refined and sophisticated",
        "Street Utility": "Bold and authentic",
        "Playful Colorful": "Fun and enthusiastic",
        "Eco Rustic": "Natural and honest",
        "Professional Clean": "Clear and trustworthy",
        "Beauty Wellness": "Gentle and nurturing",
        "Kitchen Home": "Practical and helpful",
        "Pets Friendly": "Caring and playful"
      };

      // Check for prohibited content
      const prohibitedSignals = [
        'medical claim', 'prescription', 'cure', 'treatment', 'therapy',
        'adult', 'vape', 'tobacco', 'weapon', 'firearm', 'cbd', 'drug'
      ];
      
      const combinedText = `${inputs.product_title} ${inputs.raw_text} ${inputs.image_captions.join(' ')}`.toLowerCase();
      const isBlocked = prohibitedSignals.some(signal => combinedText.includes(signal));

      if (isBlocked) {
        return {
          blocked: true,
          blocked_reason: "Product contains prohibited content (medical claims, adult content, weapons, or restricted substances)",
          style: { primary: "", secondary: "", confidence: 0.0 },
          theme: "",
          palette: { primary: "#111111", accent_1: "#1F6FEB", accent_2: "#E6E6E6", background: "#FFFFFF" },
          typography: { heading: "", body: "" },
          tone: "",
          copy: {
            hero: { headline: "", subhead: "", cta: "Shop now" },
            bullets: ["", "", "", "", ""],
            description: "",
            specs: [],
            faq: [
              { q: "Shipping", a: "" },
              { q: "Returns", a: "" },
              { q: "Warranty", a: "" },
              { q: "Compatibility", a: "" }
            ]
          },
          images: {
            hero_prompt: "",
            gallery_prompts: [],
            detail_prompts: []
          },
          layout: {
            pdp_order: ["hero", "gallery", "bullets", "description", "specs", "faq", "trust"]
          },
          proof: {
            badges: ["SSL secure", "30 day returns", "Fast shipping"]
          }
        };
      }

      const prompt = `
        Analyze this product and generate premium Shopify theme design worth $100,000. Extract key signals from materials, finish, audience, verbs, photography style, colors, and image descriptions.

        Product Information:
        - Title: ${inputs.product_title}
        - Category: ${inputs.product_category}
        - Description: ${inputs.raw_text}
        - Image Captions: ${inputs.image_captions.join(', ')}
        - Target Market: ${inputs.target_market}
        - Currency: ${inputs.currency}

        Style Classes Available: Modern Minimal, Cozy Natural, Tech Futuristic, Sport Performance, Luxury Elegant, Street Utility, Playful Colorful, Eco Rustic, Professional Clean, Beauty Wellness, Kitchen Home, Pets Friendly

        Analyze the product signals and respond with ONLY valid JSON in this exact format:
        {
          "blocked": false,
          "blocked_reason": "",
          "style": {
            "primary": "exact style class from list above",
            "secondary": "secondary style class from list above", 
            "confidence": 0.85
          },
          "theme": "free Shopify theme name",
          "palette": {
            "primary": "#111111",
            "accent_1": "#1F6FEB", 
            "accent_2": "#E6E6E6",
            "background": "#FFFFFF"
          },
          "typography": {
            "heading": "font family for headings",
            "body": "font family for body text"
          },
          "tone": "tone description for copy",
          "copy": {
            "hero": {
              "headline": "compelling 6-8 word headline",
              "subhead": "supporting 12-15 word subheadline",
              "cta": "Shop now"
            },
            "bullets": [
              "benefit 1 (8-12 words)",
              "benefit 2 (8-12 words)", 
              "benefit 3 (8-12 words)",
              "benefit 4 (8-12 words)",
              "benefit 5 (8-12 words)"
            ],
            "description": "80-120 word product description focusing on benefits and value",
            "specs": ["spec 1", "spec 2", "spec 3", "spec 4"],
            "faq": [
              {"q": "Shipping", "a": "detailed shipping answer"},
              {"q": "Returns", "a": "detailed returns answer"},
              {"q": "Warranty", "a": "detailed warranty answer"},
              {"q": "Compatibility", "a": "detailed compatibility answer"}
            ]
          },
          "images": {
            "hero_prompt": "detailed prompt for hero image generation",
            "gallery_prompts": ["prompt 1", "prompt 2", "prompt 3"],
            "detail_prompts": ["detail prompt 1", "detail prompt 2"]
          },
          "layout": {
            "pdp_order": ["hero", "gallery", "bullets", "description", "specs", "faq", "trust"]
          },
          "proof": {
            "badges": ["SSL secure", "30 day returns", "Fast shipping"]
          }
        }
      `;

      const response = await premiumOpenai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert premium e-commerce designer specializing in $100,000+ Shopify theme designs. Analyze product signals to determine the perfect style class, extract color palettes from imagery descriptions, and create conversion-optimized copy. ONLY respond with valid JSON - no explanations or additional text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const design = JSON.parse(response.choices[0].message.content!);
      
      // Apply style mappings
      const primaryStyle = design.style.primary;
      const mappedTheme = styleMapping[primaryStyle as keyof typeof styleMapping] || "Dawn";
      const mappedTypography = typographyMapping[primaryStyle as keyof typeof typographyMapping] || { heading: "Sans Serif", body: "Sans Serif" };
      const mappedTone = toneMapping[primaryStyle as keyof typeof toneMapping] || "Clear and professional";

      // Validate and apply mappings
      return {
        blocked: false,
        blocked_reason: "",
        style: {
          primary: design.style.primary || "Modern Minimal",
          secondary: design.style.secondary || "Professional Clean",
          confidence: design.style.confidence || 0.85
        },
        theme: mappedTheme,
        palette: design.palette || {
          primary: "#111111",
          accent_1: "#1F6FEB",
          accent_2: "#E6E6E6", 
          background: "#FFFFFF"
        },
        typography: mappedTypography,
        tone: mappedTone,
        copy: design.copy || {
          hero: { headline: "", subhead: "", cta: "Shop now" },
          bullets: ["", "", "", "", ""],
          description: "",
          specs: [],
          faq: [
            { q: "Shipping", a: "" },
            { q: "Returns", a: "" },
            { q: "Warranty", a: "" },
            { q: "Compatibility", a: "" }
          ]
        },
        images: design.images || {
          hero_prompt: "",
          gallery_prompts: [],
          detail_prompts: []
        },
        layout: design.layout || {
          pdp_order: ["hero", "gallery", "bullets", "description", "specs", "faq", "trust"]
        },
        proof: design.proof || {
          badges: ["SSL secure", "30 day returns", "Fast shipping"]
        }
      };

    } catch (error) {
      console.error('Premium theme generation failed:', error);
      
      // Return fallback design
      return {
        blocked: false,
        blocked_reason: "",
        style: {
          primary: "Modern Minimal",
          secondary: "Professional Clean",
          confidence: 0.75
        },
        theme: "Dawn",
        palette: {
          primary: "#111111",
          accent_1: "#1F6FEB",
          accent_2: "#E6E6E6",
          background: "#FFFFFF"
        },
        typography: {
          heading: "Geometric Sans",
          body: "System Sans"
        },
        tone: "Clear and professional",
        copy: {
          hero: {
            headline: inputs.product_title,
            subhead: "Premium quality you can trust",
            cta: "Shop now"
          },
          bullets: [
            "High-quality materials and construction",
            "Fast and reliable shipping worldwide", 
            "30-day money-back guarantee",
            "Expert customer support team",
            "Trusted by thousands of customers"
          ],
          description: "Experience the perfect blend of quality and value with our premium product. Designed with attention to detail and built to last, this item delivers exceptional performance that exceeds expectations. Join thousands of satisfied customers who trust our commitment to excellence.",
          specs: ["Premium materials", "Durable construction", "Multiple sizes available", "1-year warranty"],
          faq: [
            { q: "Shipping", a: "Free shipping on orders over $50. Standard delivery in 3-7 business days." },
            { q: "Returns", a: "30-day money-back guarantee. Return for any reason within 30 days." },
            { q: "Warranty", a: "1-year manufacturer warranty covering defects and normal wear." },
            { q: "Compatibility", a: "Compatible with most standard applications. See specifications for details." }
          ]
        },
        images: {
          hero_prompt: `Professional product photography of ${inputs.product_title}, clean white background, studio lighting`,
          gallery_prompts: [
            `${inputs.product_title} in use, lifestyle photography`,
            `Close-up detail shot of ${inputs.product_title} features`,
            `${inputs.product_title} packaging and accessories`
          ],
          detail_prompts: [
            `Technical diagram of ${inputs.product_title} components`,
            `Size comparison chart for ${inputs.product_title}`
          ]
        },
        layout: {
          pdp_order: ["hero", "gallery", "bullets", "description", "specs", "faq", "trust"]
        },
        proof: {
          badges: ["SSL secure", "30 day returns", "Fast shipping"]
        }
      };
    }
  }

  private getDefaultFAQs() {
    return [
      { question: "How fast is shipping?", answer: "We offer free shipping on orders over $50 with delivery in 3-7 business days." },
      { question: "What's your return policy?", answer: "30-day money-back guarantee. If you're not satisfied, return for a full refund." },
      { question: "Is this compatible with my device?", answer: "Our product works with all major devices and platforms. Check specifications for details." },
      { question: "Do you offer a warranty?", answer: "Yes, we provide a 1-year manufacturer warranty covering defects and malfunctions." }
    ];
  }

  private getFallbackContent(productData: ProductData): GeneratedContent {
    return {
      productTitle: productData.title,
      productTitleVariants: [productData.title],
      productDescription: productData.description,
      features: productData.features.slice(0, 5),
      faqs: this.getDefaultFAQs(),
      metaDescription: `Buy ${productData.title} with fast shipping and great customer service.`,
      brandName: productData.brand || "Premium Store",
      brandColors: {
        primary: "#6366f1",
        secondary: "#3b82f6",
        accent: "#8b5cf6"
      },
      heroHeadline: `Get Your ${productData.title} Today`,
      heroSubheadline: "Premium quality, fast delivery, satisfaction guaranteed.",
      callToAction: "Buy Now",
      generatedImages: [] // No fallback images allowed
    };
  }

  async generateProductImages(productData: ProductData, productTitle: string): Promise<string[]> {
    console.log('PREMIUM IMAGE SYSTEM: Using original product images only - no AI generation');
    console.log('Available original images:', productData.images);
    
    // NEVER generate artificial images - only use authentic original product photos
    if (productData.images && productData.images.length > 0) {
      console.log('Returning authentic original product images for premium store');
      return productData.images.slice(0, 3); // Use up to 3 original images
    } else {
      console.log('No original product images available - cannot create store without authentic images');
      throw new Error('Premium stores require authentic product images - no AI generation allowed');
    }
  }



  async analyzeProductImages(imageUrls: string[], productTitle: string): Promise<string | null> {
    try {
      console.log('Starting image analysis for product:', productTitle);
      console.log('Image URLs:', imageUrls);
      
      if (!imageUrls || imageUrls.length === 0) {
        console.log('No image URLs provided for analysis');
        return null;
      }

      // Use the first available image for analysis
      const imageUrl = imageUrls[0];
      console.log('Analyzing image URL:', imageUrl);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a product photography expert. Analyze this product image and provide a detailed, accurate description of what you see. Focus on the actual physical product, its shape, color, materials, design details, and any visible features. Be precise and factual."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this product image for "${productTitle}" and describe exactly what the product looks like. Include: shape, size, color, materials, design elements, any buttons/ports/features, packaging if visible. Be very specific and accurate.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      });

      const analysis = response.choices[0].message.content;
      console.log('Image analysis result:', analysis);
      return analysis;
    } catch (error) {
      console.error('Product image analysis failed:', error);
      if (error instanceof Error) {
        console.error('Analysis error details:', error.message);
      }
      return null;
    }
  }

  async generateImageWithChatGPT(referenceImageUrl: string, prompt: string): Promise<string | null> {
    // DISABLED: No AI image generation - causes wrong product generation
    console.log('AI Image generation disabled - using original product images only');
    return null;
  }



  // REMOVED: DALL-E 3 image prompt generation - never use AI for images

  // REMOVED: DALL-E 3 image prompt generation - never use AI for images

  async generateProductVariations(productData: ProductData): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Generate 5 compelling product title variations for e-commerce. Focus on benefits and keywords that convert."
          },
          {
            role: "user",
            content: `Original title: ${productData.title}\nFeatures: ${productData.features.join(', ')}\n\nReturn as JSON array: {"variations": ["title1", "title2", ...]}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return result.variations || [productData.title];
    } catch (error) {
      console.error('Title variation generation failed:', error);
      return [productData.title];
    }
  }

  async generatePremiumImages(productData: ProductData, premiumTheme: PremiumThemeDesign): Promise<string[]> {
    console.log('DALL-E 3 COMPLETELY DISABLED - Using only authentic original product images');
    
    // NEVER generate AI images - only return original authentic product photos
    if (productData.images && productData.images.length > 0) {
      console.log('Returning authentic original images instead of AI generation:', productData.images);
      return productData.images.slice(0, 3);
    } else {
      console.log('No original images available - cannot create store without authentic images');
      return [];
    }
  }

  // REMOVED: DALL-E 3 style image prompts - never generate AI images
}
