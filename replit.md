# Overview

This is an AI-powered Shopify store builder with integrated referral and OAuth systems that transforms product URLs into complete, branded stores while generating recurring revenue through Shopify Partner commissions. The platform combines automated store creation with a "Done-For-You" service model, earning 20% lifetime commissions on all referred Shopify subscriptions.

## Recent Changes (August 16, 2025)
- **PREMIUM THEME SYSTEM COMPLETED**: Full $100,000-quality theme generation integrated into main pipeline
- **Triple API Key Architecture**: OPENAI_API_KEY_PREMIUM (theme analysis), OPENAI_API_KEY (content), OPENAI_API_KEY_IMAGES (GPT Image 1)
- **12 Design Classes Implemented**: Modern Minimal, Luxury Elegant, Tech Futuristic, Sport Performance, etc. mapped to free Shopify themes
- **GPT-5 Available**: GPT-5 released August 7, 2025 - better analysis but no image generation
- **GPT Image 1 ATTEMPTED**: Implemented GPT Image 1 with user's exact advertising executive prompt, but API experiencing severe response corruption (millions of repeated characters)
- **FALLBACK TO AUTHENTIC IMAGES**: System properly detects GPT Image 1 corruption and falls back to using authentic original product images as designed
- **Premium Store Previews**: Enhanced mockups show theme confidence scores and professional styling  
- **Complete Automation**: Product URLs automatically generate premium-styled stores with appropriate themes
- **Current Status**: Using authentic original product images while GPT Image 1 API issues are resolved
- **CRITICAL RULE**: System prioritizes authentic original images over corrupted AI generation

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for development and building
- **UI Components**: shadcn/ui component library built on Radix UI primitives with Tailwind CSS
- **Routing**: Wouter for client-side routing with pages for home, dashboard, and store preview
- **State Management**: TanStack Query (React Query) for server state management and data fetching
- **Styling**: Tailwind CSS with CSS variables for theming, custom design system with primary/secondary colors

## Backend Architecture
- **Runtime**: Node.js with Express.js server using TypeScript and ESM modules
- **API Design**: RESTful API with endpoints for store building (`/api/build`) and status checking (`/api/status/:id`)
- **Data Storage**: In-memory storage implementation with interface for future database integration
- **Services Layer**: Modular services for web scraping, AI content generation, and Shopify automation

## Core Services
- **ProductScraper**: Extracts product data from various e-commerce platforms with site-specific scraping logic
- **AIContentGenerator**: Uses OpenAI API to generate marketing copy, product descriptions, FAQs, and branding
- **ShopifyService**: Partner API integration for store management and product configuration
- **ShopifyOAuthService**: Handles OAuth authentication flow for connecting to customer Shopify stores
- **ReferralService**: Manages referral link generation, tracking, and commission calculations

## Data Models
- **Users**: Basic user management with username, email, password
- **Projects**: Store build projects with status tracking, product data, generated content, and build logs
- **Templates**: Store theme templates with configuration options
- **ShopifyStores**: OAuth tokens and store connections with commission tracking
- **Referrals**: Referral link tracking with conversion metrics and revenue data

## Database Integration
- **ORM**: Drizzle ORM configured for PostgreSQL with migrations support
- **Database**: PostgreSQL (configured but using in-memory storage for development)
- **Schema**: Well-defined database schema with proper relationships and constraints

# External Dependencies

## Core Services
- **OpenAI API**: For AI content generation, product copywriting, and brand name creation
- **Shopify Partner API**: For creating development stores and transferring ownership
- **Neon Database**: PostgreSQL hosting service for production data storage

## Web Scraping & Content
- **Cheerio**: HTML parsing and manipulation for product data extraction
- **Fetch API**: HTTP client for web scraping and API requests

## Frontend Libraries
- **Radix UI**: Headless component primitives for accessibility and functionality
- **TanStack Query**: Data fetching, caching, and synchronization
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Wouter**: Lightweight client-side router

## Development Tools
- **Vite**: Build tool and development server with React plugin
- **TypeScript**: Type safety and developer experience
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Fast JavaScript bundler for production builds

## Production Infrastructure
- **Replit**: Hosting platform with integrated development environment
- **PostgreSQL**: Production database for storing projects and user data