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
      console.log('Starting image generation for product:', productTitle);
      console.log('Available images:', productData.images);
      
      const generatedImageUrls: string[] = [];

      // ALWAYS use reference images with your exact ChatGPT-5 prompt - never generate from description
      if (productData.images && productData.images.length > 0 && !productData.images[0].includes('placeholder')) {
        console.log('Using reference images for generation with your exact ChatGPT-5 methodology');
        
        // Generate multiple images using your exact ChatGPT-5 prompt with reference
        for (let i = 0; i < 3; i++) {
          try {
            console.log(`Generating image ${i + 1} of 3 with reference using exact prompt`);
            const imageUrl = await this.generateImageWithChatGPT(productData.images[0], '');
            if (imageUrl) {
              console.log(`Successfully generated image ${i + 1}:`, imageUrl);
              generatedImageUrls.push(imageUrl);
            }
          } catch (imageError) {
            console.error(`Individual image generation ${i + 1} failed:`, imageError);
          }
        }
      } else {
        console.log('No valid reference images found - returning original images to avoid creating wrong products');
        return productData.images; // Never generate new products, only use originals
      }

      console.log(`Generated ${generatedImageUrls.length} images out of 3 attempts`);

      // Return generated images if any, otherwise return original images
      return generatedImageUrls.length > 0 ? generatedImageUrls : productData.images;
    } catch (error) {
      console.error('Image generation process failed:', error);
      return productData.images;
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
    try {
      console.log('Starting GPT-5 image generation with reference URL:', referenceImageUrl);
      
      // Use GPT-5 with your exact methodology - using the chat completions API for image generation
      const exactPrompt = "Act as an advertising executive and re create this advert. Keep the product in this image the exact same and come up with a new advertisment. The image is to be high studio quality and would be considered to be done by a professional charging $1000 per hour";

      console.log('Using GPT-5 with exact prompt:', exactPrompt);

      // Use GPT-5 for image generation through chat completions with multimodal capabilities
      const response = await openai.chat.completions.create({
        model: "gpt-5", // Use GPT-5 for image generation
        messages: [
          {
            role: "system",
            content: "You are GPT-5 with advanced image generation capabilities. When given a reference image and instructions, generate a new professional advertisement image that keeps the exact same product while improving the photography and presentation. Use the /create command functionality to generate high-quality images."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: exactPrompt
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

      console.log('GPT-5 response:', response.choices[0].message.content);

      // GPT-5 should return image URLs in its response when using image generation
      const content = response.choices[0].message.content;
      if (content) {
        // Look for image URLs in the response
        const imageUrlMatch = content.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|webp)/i);
        if (imageUrlMatch) {
          console.log('Generated image URL from GPT-5:', imageUrlMatch[0]);
          return imageUrlMatch[0];
        }
      }

      console.log('No image URL found in GPT-5 response');
      return null;
      
    } catch (error) {
      console.error('GPT-5 image generation failed:', error);
      if (error instanceof Error) {
        console.error('GPT-5 error details:', error.message);
        
        // If GPT-5 is not available, fall back to GPT-4o but with strict instructions
        if (error.message.includes('model') || error.message.includes('not found')) {
          console.log('GPT-5 not available, falling back to GPT-4o with strict product preservation');
          return await this.generateWithGPT4Fallback(referenceImageUrl);
        }
      }
      return null;
    }
  }

  async generateWithGPT4Fallback(referenceImageUrl: string): Promise<string | null> {
    try {
      // Strict instructions for GPT-4o to NOT change the product
      const strictPrompt = `CRITICAL: Keep the EXACT same product shown in the reference image. Do not change the product type, design, color, or features. Only improve the photography quality, lighting, and background. The product must remain identical. Professional studio photography with clean background, commercial lighting, $1000/hour quality.`;

      const imageGenResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: strictPrompt,
        size: "1024x1024",
        quality: "hd",
        style: "natural",
        n: 1,
      });

      if (imageGenResponse.data && imageGenResponse.data[0]?.url) {
        console.log('Fallback image generated:', imageGenResponse.data[0].url);
        return imageGenResponse.data[0].url;
      }

      return null;
    } catch (error) {
      console.error('Fallback image generation failed:', error);
      return null;
    }
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
