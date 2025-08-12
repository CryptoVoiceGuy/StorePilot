import { type User, type InsertUser, type Project, type InsertProject, type Template, type InsertTemplate } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByUser(userId: string): Promise<Project[]>;
  createProject(project: InsertProject & { userId: string }): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;
  
  // Templates
  getTemplate(id: string): Promise<Template | undefined>;
  getActiveTemplates(): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private templates: Map<string, Template>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.templates = new Map();
    
    // Initialize with some default templates
    this.initializeTemplates();
    
    // Load persisted data in development
    this.loadPersistedData();
  }

  private loadPersistedData() {
    // For development, we'll add some sample data to demonstrate functionality
    // In production, this would connect to a real database
    try {
      const sampleProject: Project = {
        id: "sample-project-demo",
        productUrl: "https://www.alibaba.com/product-detail/New-Design-Custom-Logo-BPA-Free_1601221435401.html",
        targetMarket: "US",
        currency: "USD",
        margin: 50,
        userId: "demo-user",
        status: "completed",
        storeName: "MixMaster Pro",
        shopifyUrl: "https://mixmaster-pro.myshopify.com",
        adminUrl: "https://mixmaster-pro.myshopify.com/admin",
        productData: {
          title: "USB Rechargeable Auto Mixing Shaker Bottle",
          price: "$29.99",
          images: [],
          description: "Elevate your fitness routine with our USB Rechargeable Auto Mixing Protein Shaker.",
          features: ["Auto-mixing technology", "BPA-free design", "700ml capacity"],
          specifications: { capacity: "700ml", material: "BPA-free plastic" },
          brand: "MixMaster",
          category: "Fitness & Sports"
        },
        generatedContent: {
          productTitle: "Portable USB Auto Mixing Shaker Bottle",
          productDescription: "Elevate your fitness routine with our USB Rechargeable Auto Mixing Protein Shaker. Designed for busy lifestyles, this 700ml shaker ensures perfectly mixed drinks at the touch of a button.",
          features: ["Auto-mixing technology", "BPA-free design", "700ml capacity"],
          faqs: [
            { question: "How long does shipping take?", answer: "5-7 business days within the US." },
            { question: "What is the warranty?", answer: "1-year warranty covering manufacturing defects." }
          ],
          metaDescription: "Shop our 700ml USB Rechargeable Shaker Bottle. BPA-free, customizable, perfect for workouts.",
          brandName: "MixMaster Pro",
          brandColors: { primary: "#6366f1", secondary: "#3b82f6", accent: "#8b5cf6" },
          heroHeadline: "Transform Your Drink Game Instantly!",
          heroSubheadline: "Perfectly blended protein shakes, anytime, anywhere.",
          callToAction: "Get Yours Today and Mix On-the-Go!"
        },
        buildLogs: [
          { step: "scraping", message: "Product data extracted successfully", timestamp: new Date() },
          { step: "ai_generation", message: "Content generation completed", timestamp: new Date() },
          { step: "shopify_creation", message: "Store created successfully", timestamp: new Date() }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      this.projects.set(sampleProject.id, sampleProject);
    } catch (error) {
      console.log("No persisted data to load");
    }
  }

  private async initializeTemplates() {
    const defaultTemplate: Template = {
      id: randomUUID(),
      name: "Modern Ecommerce",
      description: "Clean, conversion-optimized template for single products",
      config: {
        colorScheme: "purple-blue",
        layout: "modern",
        sections: ["hero", "features", "testimonials", "faq"]
      },
      isActive: true,
      createdAt: new Date(),
    };
    this.templates.set(defaultTemplate.id, defaultTemplate);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.userId === userId,
    );
  }

  async createProject(projectData: InsertProject & { userId: string }): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...projectData,
      id,
      status: "pending",
      storeName: null,
      shopifyUrl: null,
      adminUrl: null,
      productData: null,
      generatedContent: null,
      buildLogs: [],
      targetMarket: projectData.targetMarket || null,
      currency: projectData.currency || null,
      margin: projectData.margin || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: new Date(),
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  // Templates
  async getTemplate(id: string): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async getActiveTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values()).filter(
      (template) => template.isActive,
    );
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = randomUUID();
    const template: Template = {
      ...insertTemplate,
      id,
      description: insertTemplate.description || null,
      isActive: true,
      createdAt: new Date(),
    };
    this.templates.set(id, template);
    return template;
  }
}

export const storage = new MemStorage();
