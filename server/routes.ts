import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema } from "@shared/schema";
import { ProductScraper } from "./services/scraper";
import { AIContentGenerator } from "./services/ai";
import { ShopifyService } from "./services/shopify";
import { shopifyOAuth } from "./services/shopify-oauth";
import { referralService } from "./services/referral";

export async function registerRoutes(app: Express): Promise<Server> {
  const scraper = new ProductScraper();
  const aiGenerator = new AIContentGenerator();
  const shopifyService = new ShopifyService();

  // Build store endpoint
  app.post("/api/build", async (req, res) => {
    try {
      const { productUrl, targetMarket = "US", currency = "USD", margin = 50, email } = req.body;
      
      // Validate input
      if (!productUrl) {
        return res.status(400).json({ error: "Product URL is required" });
      }

      // Create project
      const project = await storage.createProject({
        productUrl,
        targetMarket,
        currency,
        margin,
        userId: "demo-user", // For demo purposes
      });

      // Start async build process
      buildStoreAsync(project.id, { productUrl, targetMarket, currency, margin, email });

      res.json({ 
        statusUrl: `/api/status/${project.id}`,
        projectId: project.id 
      });
    } catch (error) {
      console.error("Build error:", error);
      res.status(500).json({ error: "Failed to start build process" });
    }
  });

  // Status endpoint
  app.get("/api/status/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.json({
        id: project.id,
        status: project.status,
        storeName: project.storeName,
        shopifyUrl: project.shopifyUrl,
        adminUrl: project.adminUrl,
        logs: project.buildLogs || [],
        productData: project.productData,
        generatedContent: project.generatedContent,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      });
    } catch (error) {
      console.error("Status error:", error);
      res.status(500).json({ error: "Failed to get project status" });
    }
  });

  // Finalize store endpoint
  app.post("/api/finalize", async (req, res) => {
    try {
      const { id, businessDetails, paymentSetupDone } = req.body;
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (project.status !== "completed") {
        return res.status(400).json({ error: "Store is not ready for finalization" });
      }

      // Simulate store transfer
      const transferResult = await shopifyService.transferStore(id, businessDetails.email);
      
      if (transferResult.success) {
        await storage.updateProject(id, {
          status: "transferred",
          buildLogs: [
            ...(project.buildLogs as any[] || []),
            { step: "transfer", message: "Store transferred successfully", timestamp: new Date() }
          ]
        });

        res.json({
          success: true,
          transferUrl: transferResult.transferUrl,
          message: "Store transfer initiated. Check your email for instructions."
        });
      } else {
        res.status(500).json({ error: "Failed to transfer store" });
      }
    } catch (error) {
      console.error("Finalize error:", error);
      res.status(500).json({ error: "Failed to finalize store" });
    }
  });

  // Get user projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjectsByUser("demo-user");
      res.json(projects);
    } catch (error) {
      console.error("Projects error:", error);
      res.status(500).json({ error: "Failed to get projects" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const projectId = req.params.id;
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Check if project belongs to the demo user (in a real app, check authenticated user)
      if (project.userId !== "demo-user") {
        return res.status(403).json({ error: "Unauthorized to delete this project" });
      }

      const deleted = await storage.deleteProject(projectId);
      
      if (deleted) {
        res.json({ success: true, message: "Store deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete store" });
      }
    } catch (error) {
      console.error("Delete project error:", error);
      res.status(500).json({ error: "Failed to delete store" });
    }
  });

  // Test Shopify Partner API connection
  app.get("/api/test-shopify", async (req, res) => {
    try {
      const shopifyService = new ShopifyService();
      const result = await shopifyService.testConnection();
      res.json(result);
    } catch (error) {
      res.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: {
          message: "Shopify service test failed. Please check your Partner API configuration."
        }
      });
    }
  });

  // Premium theme design endpoint
  app.post("/api/premium-theme", async (req, res) => {
    try {
      const { 
        product_url, 
        product_title, 
        product_category, 
        raw_text, 
        image_captions, 
        target_market, 
        currency 
      } = req.body;

      // Validate required inputs
      if (!product_url || !product_title || !product_category || !raw_text) {
        return res.status(400).json({ 
          error: "Missing required fields: product_url, product_title, product_category, raw_text" 
        });
      }

      // Generate premium theme design
      const themeDesign = await aiGenerator.generatePremiumTheme({
        product_url,
        product_title,
        product_category,
        raw_text,
        image_captions: image_captions || [],
        target_market: target_market || "US",
        currency: currency || "USD"
      });

      // Return strict JSON only
      res.setHeader('Content-Type', 'application/json');
      res.json(themeDesign);
    } catch (error) {
      console.error("Premium theme generation error:", error);
      res.status(500).json({ 
        blocked: false,
        blocked_reason: "",
        style: { primary: "Modern Minimal", secondary: "Professional Clean", confidence: 0.75 },
        theme: "Dawn",
        palette: { primary: "#111111", accent_1: "#1F6FEB", accent_2: "#E6E6E6", background: "#FFFFFF" },
        typography: { heading: "Geometric Sans", body: "System Sans" },
        tone: "Clear and professional",
        copy: {
          hero: { headline: "Premium Quality Product", subhead: "Experience excellence in every detail", cta: "Shop now" },
          bullets: ["High-quality materials", "Fast shipping", "30-day returns", "Expert support", "Trusted quality"],
          description: "Experience the perfect blend of quality and value with our premium product. Designed with attention to detail and built to last.",
          specs: ["Premium materials", "Durable construction", "Multiple sizes", "1-year warranty"],
          faq: [
            { q: "Shipping", a: "Free shipping on orders over $50. Standard delivery in 3-7 business days." },
            { q: "Returns", a: "30-day money-back guarantee. Return for any reason within 30 days." },
            { q: "Warranty", a: "1-year manufacturer warranty covering defects and normal wear." },
            { q: "Compatibility", a: "Compatible with most standard applications. See specifications for details." }
          ]
        },
        images: {
          hero_prompt: "Professional product photography, clean white background, studio lighting",
          gallery_prompts: ["Product in use lifestyle photography", "Close-up detail features", "Packaging and accessories"],
          detail_prompts: ["Technical diagram components", "Size comparison chart"]
        },
        layout: { pdp_order: ["hero", "gallery", "bullets", "description", "specs", "faq", "trust"] },
        proof: { badges: ["SSL secure", "30 day returns", "Fast shipping"] }
      });
    }
  });

  // Async build function
  async function buildStoreAsync(projectId: string, params: any) {
    try {
      const logs: any[] = [];
      
      // Update status to processing
      await storage.updateProject(projectId, { 
        status: "processing",
        buildLogs: [{ step: "start", message: "Starting store build process", timestamp: new Date() }]
      });

      // Step 1: Scrape product data
      logs.push({ step: "scraping", message: "Extracting product information...", timestamp: new Date() });
      await storage.updateProject(projectId, { buildLogs: logs });
      
      const productData = await scraper.scrapeProduct(params.productUrl);
      
      logs.push({ step: "scraping_complete", message: "Product data extracted successfully", timestamp: new Date() });
      await storage.updateProject(projectId, { 
        productData: productData as any,
        buildLogs: logs 
      });

      // Step 2: Generate premium theme design
      logs.push({ step: "theme_analysis", message: "Analyzing product for premium theme design...", timestamp: new Date() });
      await storage.updateProject(projectId, { buildLogs: logs });
      
      // Generate premium theme design based on product data
      const premiumTheme = await aiGenerator.generatePremiumTheme({
        product_url: params.productUrl,
        product_title: productData.title,
        product_category: productData.category || "General",
        raw_text: productData.description,
        image_captions: productData.images.map((img, i) => `Product image ${i + 1}`),
        target_market: params.targetMarket || "US",
        currency: params.currency || "USD"
      });
      
      console.log('Premium theme generated:', JSON.stringify(premiumTheme, null, 2));

      logs.push({ step: "theme_complete", message: `Premium theme designed: ${premiumTheme.style.primary} → ${premiumTheme.theme}`, timestamp: new Date() });

      // Generate enhanced content using premium theme specifications
      logs.push({ step: "ai_generation", message: "Generating enhanced store content...", timestamp: new Date() });
      await storage.updateProject(projectId, { buildLogs: logs });
      
      const generatedContent = await aiGenerator.generateStoreContent(productData, params.targetMarket);
      
      // Generate premium images that match the selected theme
      logs.push({ step: "image_generation", message: `Generating premium ${premiumTheme.style.primary} style images...`, timestamp: new Date() });
      await storage.updateProject(projectId, { buildLogs: logs });
      
      let premiumImages: string[] = [];
      try {
        premiumImages = await aiGenerator.generatePremiumImages(productData, premiumTheme);
        if (premiumImages.length > 0) {
          logs.push({ step: "image_complete", message: `Generated ${premiumImages.length} premium images`, timestamp: new Date() });
        } else {
          logs.push({ step: "image_warning", message: "Premium image generation returned empty - check API quota", timestamp: new Date() });
        }
      } catch (imageError) {
        console.error('Premium image generation failed:', imageError);
        logs.push({ step: "image_warning", message: `Premium image failed: ${imageError.message}`, timestamp: new Date() });
      }

      // Merge premium theme design with generated content
      const enhancedContent = {
        ...generatedContent,
        premiumTheme: premiumTheme,
        productTitle: premiumTheme.copy.hero.headline || generatedContent.productTitle,
        heroHeadline: premiumTheme.copy.hero.headline || generatedContent.heroHeadline,
        heroSubheadline: premiumTheme.copy.hero.subhead || generatedContent.heroSubheadline,
        callToAction: premiumTheme.copy.hero.cta || generatedContent.callToAction,
        features: premiumTheme.copy.bullets || generatedContent.features,
        productDescription: premiumTheme.copy.description || generatedContent.productDescription,
        generatedImages: premiumImages.length > 0 ? premiumImages : productData.images,
        brandColors: {
          primary: premiumTheme.palette.primary,
          secondary: premiumTheme.palette.accent_1,
          accent: premiumTheme.palette.accent_2
        }
      };
      
      logs.push({ step: "ai_complete", message: "Enhanced content generation completed", timestamp: new Date() });
      await storage.updateProject(projectId, { 
        generatedContent: enhancedContent as any,
        buildLogs: logs 
      });

      // Step 3: Create Shopify store with premium theme
      logs.push({ step: "shopify_creation", message: `Creating ${premiumTheme.theme} store with ${premiumTheme.style.primary} design...`, timestamp: new Date() });
      await storage.updateProject(projectId, { buildLogs: logs });
      
      const store = await shopifyService.createDevelopmentStore(productData, enhancedContent, {
        storeName: enhancedContent.brandName,
        currency: params.currency,
        market: params.targetMarket,
        theme: premiumTheme.theme,
        style: premiumTheme.style.primary
      });
      
      logs.push({ step: "shopify_complete", message: "Store created successfully", timestamp: new Date() });
      
      // Final update
      await storage.updateProject(projectId, {
        status: "completed",
        storeName: store.name,
        shopifyUrl: store.url,
        adminUrl: store.adminUrl,
        buildLogs: logs,
      });

    } catch (error) {
      console.error("Build process error:", error);
      
      await storage.updateProject(projectId, {
        status: "failed",
        buildLogs: [
          ...(await storage.getProject(projectId))?.buildLogs as any[] || [],
          { step: "error", message: `Build failed: ${error instanceof Error ? error.message : 'Unknown error'}`, timestamp: new Date() }
        ],
      });
    }
  }

  // ===== REFERRAL & OAUTH ROUTES =====
  
  /**
   * Create referral link for Shopify signup
   */
  app.post("/api/referral/create", async (req, res) => {
    try {
      const { projectId, customerEmail } = req.body;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Generate store name suggestions from product data
      const storeNameSuggestions = (project.generatedContent as any)?.brandName ? 
        referralService.generateStoreNameSuggestions(project) : 
        [`store-${Date.now()}`];
      
      // Create referral link
      const { referralUrl, referral } = await referralService.createReferralLink(
        projectId,
        project.userId || "demo-user",
        storeNameSuggestions[0],
        customerEmail
      );
      
      res.json({
        referralUrl,
        referralCode: referral.referralCode,
        storeNameSuggestions,
        instructions: {
          step1: "Click the referral link to create your Shopify account",
          step2: "Choose a store name and complete signup",
          step3: "You'll be redirected back to complete store setup",
          step4: "We'll automatically configure your store with your product"
        }
      });
    } catch (error) {
      console.error("Referral creation error:", error);
      res.status(500).json({ error: "Failed to create referral link" });
    }
  });
  
  /**
   * Begin OAuth flow after Shopify signup
   */
  app.get("/api/shopify/oauth/begin", async (req, res) => {
    try {
      const { code: referralCode, shop } = req.query as { code: string; shop: string };
      
      if (!referralCode) {
        return res.status(400).json({ error: "Referral code required" });
      }
      
      if (!shop) {
        // If no shop provided yet, show waiting page
        return res.send(`
          <html>
            <head>
              <title>Completing Shopify Setup...</title>
              <meta http-equiv="refresh" content="5">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 50px; }
                .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #6366f1; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              </style>
            </head>
            <body>
              <h1>Almost there!</h1>
              <div class="spinner"></div>
              <p>Waiting for your Shopify store to be created...</p>
              <p>This page will automatically refresh.</p>
            </body>
          </html>
        `);
      }
      
      // Track referral click
      await referralService.trackReferralClick(referralCode);
      
      // Generate OAuth state with referral code
      const state = `${referralCode}:${shopifyOAuth.generateState()}`;
      
      // Store state in session or temporary storage
      // For demo, we'll pass it through the OAuth flow
      
      // Redirect to Shopify OAuth
      const authUrl = shopifyOAuth.generateAuthUrl(shop, state);
      res.redirect(authUrl);
      
    } catch (error) {
      console.error("OAuth begin error:", error);
      res.status(500).json({ error: "Failed to start OAuth flow" });
    }
  });
  
  /**
   * OAuth callback from Shopify
   */
  app.get("/api/shopify/callback", async (req, res) => {
    try {
      const { shop, code, state, hmac } = req.query as { 
        shop: string; 
        code: string; 
        state: string;
        hmac: string;
      };
      
      // Verify request signature
      if (!shopifyOAuth.verifyRequestSignature(req.query as any)) {
        return res.status(401).json({ error: "Invalid request signature" });
      }
      
      // Extract referral code from state
      const [referralCode] = state.split(':');
      
      // Exchange code for access token
      const { accessToken, scope } = await shopifyOAuth.exchangeCodeForToken(shop, code);
      
      // Get referral and project
      const referral = await storage.getReferralByCode(referralCode);
      if (!referral) {
        return res.status(404).json({ error: "Referral not found" });
      }
      
      const project = await storage.getProject(referral.projectId || '');
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Save Shopify store credentials
      const shopifyStore = await storage.createShopifyStore({
        userId: referral.userId || "demo-user",
        projectId: referral.projectId,
        shopDomain: shop,
        accessToken,
        scope,
        referralStatus: "active",
        commissionTier: "basic", // Will be updated based on actual plan
      });
      
      // Mark referral as converted
      await referralService.markReferralConverted(referralCode, shopifyStore.id);
      
      // Update project with store info
      await storage.updateProject(project.id, {
        shopifyUrl: `https://${shop}`,
        adminUrl: `https://${shop}/admin`,
        status: "configuring",
      });
      
      // Start automatic store configuration
      configureStoreAsync(shopifyStore.id, project.id);
      
      // Redirect to success page
      res.redirect(`/?success=true&projectId=${project.id}`);
      
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).json({ error: "Failed to complete OAuth flow" });
    }
  });
  
  /**
   * Get referral statistics
   */
  app.get("/api/referral/stats", async (req, res) => {
    try {
      const userId = "demo-user"; // In production, get from session
      const stats = await referralService.getReferralStats(userId);
      
      res.json({
        ...stats,
        estimatedMonthlyRevenueFormatted: `$${(stats.estimatedMonthlyRevenue / 100).toFixed(2)}`,
        projectedAnnualRevenue: stats.estimatedMonthlyRevenue * 12,
        projectedAnnualRevenueFormatted: `$${(stats.estimatedMonthlyRevenue * 12 / 100).toFixed(2)}`,
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Failed to get referral stats" });
    }
  });
  
  /**
   * Configure store after OAuth (async)
   */
  async function configureStoreAsync(shopifyStoreId: string, projectId: string) {
    try {
      const store = await storage.getShopifyStore(shopifyStoreId);
      const project = await storage.getProject(projectId);
      
      if (!store || !project) return;
      
      // Create API client
      const apiClient = shopifyOAuth.createApiClient(store.shopDomain, store.accessToken);
      
      // Configure store with product data
      if (project.productData && project.generatedContent) {
        // Create product
        const generatedContent = project.generatedContent as any;
        const productData = project.productData as any;
        
        await apiClient.createProduct({
          title: generatedContent.productTitle,
          body_html: generatedContent.productDescription,
          vendor: generatedContent.brandName,
          product_type: productData.category,
          images: productData.images?.map((url: string) => ({ src: url })),
          variants: [{
            price: productData.price?.replace('$', ''),
            inventory_quantity: 100,
            inventory_management: 'shopify',
          }],
        });
        
        // Update project status
        await storage.updateProject(projectId, {
          status: "completed",
          buildLogs: [
            ...(project.buildLogs as any[] || []),
            { step: "oauth_complete", message: "OAuth connection established", timestamp: new Date() },
            { step: "store_configured", message: "Store configured successfully", timestamp: new Date() },
          ],
        });
      }
    } catch (error) {
      console.error("Store configuration error:", error);
      await storage.updateProject(projectId, {
        status: "failed",
        buildLogs: [
          ...(await storage.getProject(projectId))?.buildLogs as any[] || [],
          { step: "configuration_error", message: `Configuration failed: ${error}`, timestamp: new Date() }
        ],
      });
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
