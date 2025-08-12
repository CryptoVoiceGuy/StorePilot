import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema } from "@shared/schema";
import { ProductScraper } from "./services/scraper";
import { AIContentGenerator } from "./services/ai";
import { ShopifyService } from "./services/shopify";

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

  // Test Shopify Partner API connection
  app.get("/api/test-shopify", async (req, res) => {
    const apiKey = process.env.SHOPIFY_PARTNER_API_KEY;
    const apiSecret = process.env.SHOPIFY_PARTNER_API_SECRET;
    const orgId = process.env.SHOPIFY_PARTNER_ORG_ID;

    if (!apiKey || !apiSecret || !orgId) {
      return res.json({
        success: false,
        error: "Shopify Partner API credentials not configured",
        details: {
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret,
          hasOrgId: !!orgId
        }
      });
    }

    try {
      const query = `
        query {
          currentAppInstallation {
            app {
              id
              title
            }
          }
        }
      `;

      const response = await fetch(`https://partners.shopify.com/${orgId}/api/2023-07/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': apiSecret,
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();

      if (result.errors) {
        return res.json({
          success: false,
          error: result.errors[0]?.message || "API error",
          details: {
            status: response.status,
            errors: result.errors,
            message: "Authentication failed. You need a Partner API App with proper access token, not a Custom App."
          }
        });
      }

      res.json({
        success: true,
        message: "Shopify Partner API connection successful",
        details: result.data
      });

    } catch (error) {
      res.json({
        success: false,
        error: error.message,
        details: {
          message: "Connection failed. Check API credentials and network connectivity."
        }
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

      // Step 2: Generate content with AI
      logs.push({ step: "ai_generation", message: "Generating store content with AI...", timestamp: new Date() });
      await storage.updateProject(projectId, { buildLogs: logs });
      
      const generatedContent = await aiGenerator.generateStoreContent(productData, params.targetMarket);
      
      logs.push({ step: "ai_complete", message: "Content generation completed", timestamp: new Date() });
      await storage.updateProject(projectId, { 
        generatedContent: generatedContent as any,
        buildLogs: logs 
      });

      // Step 3: Create Shopify store
      logs.push({ step: "shopify_creation", message: "Creating Shopify store...", timestamp: new Date() });
      await storage.updateProject(projectId, { buildLogs: logs });
      
      const store = await shopifyService.createDevelopmentStore(productData, generatedContent, {
        storeName: generatedContent.brandName,
        currency: params.currency,
        market: params.targetMarket,
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

  const httpServer = createServer(app);
  return httpServer;
}
