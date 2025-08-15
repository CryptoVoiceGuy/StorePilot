import OpenAI from "openai";
import { ProductData } from "./scraper";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

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
      const generatedImages = await this.generateProductImages(productData, content.productTitle || productData.title);
      
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
      generatedImages: productData.images // Use scraped images as fallback
    };
  }

  async generateProductImages(productData: ProductData, productTitle: string): Promise<string[]> {
    try {
      // First, analyze the scraped images to understand what the product actually looks like
      const productDescription = await this.analyzeProductImages(productData.images, productTitle);
      
      if (!productDescription) {
        // If analysis fails, return original images to avoid generating wrong products
        console.log('Image analysis failed, using original images to avoid product mismatch');
        return productData.images;
      }

      // Create precise prompts based on the actual product analysis
      const imagePrompts = this.createPreciseImagePrompts(productDescription, productTitle);
      const generatedImageUrls: string[] = [];

      // Generate multiple images using GPT-4o with /create command
      for (const prompt of imagePrompts.slice(0, 3)) { // Generate up to 3 images
        try {
          const imageUrl = await this.generateImageWithChatGPT(productData.images[0], prompt);
          if (imageUrl) {
            generatedImageUrls.push(imageUrl);
          }
        } catch (imageError) {
          console.error('Individual image generation failed:', imageError);
          // Continue with other images even if one fails
        }
      }

      // If no images were generated, return the scraped images as fallback
      return generatedImageUrls.length > 0 ? generatedImageUrls : productData.images;
    } catch (error) {
      console.error('Image generation failed:', error);
      // Return scraped images as fallback to avoid wrong products
      return productData.images;
    }
  }

  async analyzeProductImages(imageUrls: string[], productTitle: string): Promise<string | null> {
    try {
      if (!imageUrls || imageUrls.length === 0) {
        return null;
      }

      // Use the first available image for analysis
      const imageUrl = imageUrls[0];
      
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

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Product image analysis failed:', error);
      return null;
    }
  }

  async generateImageWithChatGPT(referenceImageUrl: string, prompt: string): Promise<string | null> {
    try {
      // Step 1: Analyze the reference image first
      const analysisResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert product photographer and image analyst. Analyze this product image and provide detailed specifications for recreating it with professional photography."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this product image and describe: 1) Product type and specific details, 2) Current lighting setup, 3) Background and composition, 4) Color palette, 5) Angles and positioning. Be extremely detailed and specific."
              },
              {
                type: "image_url",
                image_url: {
                  url: referenceImageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 800,
      });

      const analysis = analysisResponse.choices[0].message.content;

      // Step 2: Use the analysis to create a precise image generation prompt
      const precisePrompt = this.createPreciseImagePrompt(analysis, prompt);

      // Step 3: Generate the image using ChatGPT-5's create function approach
      const imageResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are ChatGPT-5 with image creation capabilities. When I say '/create', generate a high-quality product image following the exact specifications provided. The output should be a professional product photograph that maintains product accuracy while improving visual quality."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `/create ${precisePrompt}`
              },
              {
                type: "image_url",
                image_url: {
                  url: referenceImageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      });

      // For now, since OpenAI's API doesn't directly return generated images through chat completions,
      // we'll use DALL-E 3 with the precise prompt created from the analysis
      const imageGenResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: precisePrompt,
        size: "1024x1024",
        quality: "hd",
        style: "natural",
        n: 1,
      });

      if (imageGenResponse.data && imageGenResponse.data[0]?.url) {
        return imageGenResponse.data[0].url;
      }

      return null;
      
    } catch (error) {
      console.error('ChatGPT-5 style image generation failed:', error);
      return null;
    }
  }

  private createPreciseImagePrompt(analysis: string | null, basePrompt: string): string {
    if (!analysis) {
      return basePrompt;
    }

    return `Professional product photography based on this analysis: ${analysis}. 
    
    Create an image that: 
    1) Shows the EXACT same product with identical design, colors, and features
    2) Uses professional studio lighting with clean, even illumination
    3) Has a clean white or neutral background suitable for e-commerce
    4) Maintains the product's authentic proportions and details
    5) Uses high-quality commercial photography techniques
    6) Keeps all branding, text, and design elements identical to the original
    
    Photography specifications: ${basePrompt}
    
    CRITICAL: The product must be identical to the analyzed image - only improve the photography quality, lighting, and background while keeping the product exactly the same.`;
  }

  private createPreciseImagePrompts(productDescription: string, productTitle: string): string[] {
    const baseInstruction = `Professional product photograph of the exact same product: ${productTitle}. Product details: ${productDescription}`;
    
    return [
      `${baseInstruction}. Studio photography with clean white background, professional lighting, commercial product shot, high resolution`,
      `${baseInstruction}. Lifestyle photography showing the product in natural use, soft natural lighting, professional e-commerce style`,
      `${baseInstruction}. Premium product photography with soft shadows and modern composition, clean background, emphasizing quality`,
      `${baseInstruction}. 45-degree angle view, professional studio setup, optimal lighting to showcase the product design`,
      `${baseInstruction}. Commercial e-commerce photography, professional lighting, clean presentation, showing the product from the best angle`
    ];
  }

  private createImagePrompts(productData: ProductData, productTitle: string): string[] {
    const baseDescription = `Professional product photography of ${productTitle}`;
    const features = productData.features.slice(0, 3).join(', ');
    const category = productData.category || 'product';
    
    return [
      `${baseDescription}, clean white background, studio lighting, high-resolution, commercial photography style, ${features}`,
      `${baseDescription}, lifestyle setting, natural lighting, professional e-commerce product shot, showing the product in use`,
      `${baseDescription}, modern minimalist composition, soft shadows, premium product photography, emphasizing quality and design`,
      `${baseDescription}, 45-degree angle view, professional studio setup, clean background, highlighting key features: ${features}`,
      `${baseDescription}, ${category} product shot, commercial photography, optimal lighting to showcase texture and materials`
    ];
  }

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
}
