# Shopify Partner API Setup Guide

## Current Problem
Your current credentials are for a **Custom App** (used for accessing individual stores), but we need a **Partner API App** (used for creating and managing development stores).

## Step-by-Step Solution

### Step 1: Access Your Shopify Partners Dashboard
1. Go to https://partners.shopify.com
2. Log in with your existing account
3. You should see your current organization dashboard

### Step 2: Create a Partner API App
1. In the Partners dashboard, click **"Apps"** in the left sidebar
2. Click **"Create app"** button
3. **Important**: Choose **"Partner API"** as the app type (NOT "Custom app" or "Public app")
4. Fill out the app details:
   - App name: "AI Store Builder" (or any name you prefer)
   - App URL: Can be temporary like `https://example.com`
   - Contact email: Your email

### Step 3: Configure API Permissions
After creating the app, you need to request the right permissions:

1. In your new Partner API app settings, find **"API access"** section
2. Request these scopes:
   - `read_apps`
   - `write_apps` 
   - `read_app_installations`
   - `write_app_installations`
   - `read_development_stores`
   - `write_development_stores`

### Step 4: Generate Access Token
1. In your Partner API app, find **"Access tokens"** section
2. Click **"Generate access token"**
3. Copy this token - this is what we need instead of the API secret

### Step 5: Get Your New Credentials
You'll need these three values:
- **Client ID**: From your Partner API app settings
- **Access Token**: The token you just generated (replaces the API secret)
- **Organization ID**: Same as before (4441682)

## What We Currently Have vs What We Need

### Current Credentials (Custom App):
```
SHOPIFY_PARTNER_API_KEY = "c108f94ddb7f06cf1903ea6c127c207f"
SHOPIFY_PARTNER_API_SECRET = "900405d7ab11a5ff0ae329bb9b5bfc5d" 
SHOPIFY_PARTNER_ORG_ID = "4441682"
```

### New Credentials Needed (Partner API App):
```
SHOPIFY_PARTNER_API_KEY = [New Client ID from Partner API app]
SHOPIFY_PARTNER_API_SECRET = [Access Token from Partner API app]
SHOPIFY_PARTNER_ORG_ID = "4441682" (stays the same)
```

## Alternative Approach (If Partner API App Creation is Restricted)

If you can't create a Partner API app, we have two options:

### Option A: Request Partner API Access
Some Shopify Partners accounts need to request special access:
1. Contact Shopify Partner Support
2. Explain you need Partner API access to create development stores
3. Provide your use case (AI-powered store builder)

### Option B: Use Shopify Admin API (Different Architecture)
Instead of creating stores, we can:
1. Set up the app to work with existing stores
2. User provides their store's Admin API credentials
3. We install products and themes on their existing store

## Test the Integration
Once you have the new credentials:
1. Update the environment variables in Replit
2. The status page will automatically test the connection
3. If successful, we can create real development stores

## Next Steps After Success
Once we have working Partner API access:
1. Real development store creation
2. Automatic product publishing 
3. Theme installation and customization
4. Store ownership transfer to customers

Would you like me to help you with any specific step, or do you prefer to try the alternative approaches?