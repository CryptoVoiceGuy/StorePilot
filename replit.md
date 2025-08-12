# Overview

This is an AI-powered e-commerce store builder that transforms a single product URL into a complete, branded Shopify store within minutes. The application scrapes product data from various platforms (Amazon, AliExpress, manufacturer sites), generates compelling marketing content using AI, and automatically creates a fully functional single-product store with professional design, payment processing, and legal pages.

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
- **ShopifyService**: Mock service for Shopify store creation and product management (prepared for Partner API integration)

## Data Models
- **Users**: Basic user management with username, email, password
- **Projects**: Store build projects with status tracking, product data, generated content, and build logs
- **Templates**: Store theme templates with configuration options

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