// Test the new Partner API token for development store creation
import fetch from 'node-fetch';

const ORGANIZATION_ID = process.env.SHOPIFY_PARTNER_ORG_ID;
const PARTNER_ACCESS_TOKEN = process.env.SHOPIFY_PARTNER_API_SECRET;

async function testPartnerAPI() {
  console.log('🧪 Testing Partner API with new token...');
  console.log('Organization ID:', ORGANIZATION_ID);
  console.log('Token starts with:', PARTNER_ACCESS_TOKEN?.substring(0, 10) + '...');

  // Test basic Partner API access first
  const testQuery = `
    query {
      currentAppInstallation {
        id
      }
    }
  `;

  try {
    const url = `https://partners.shopify.com/${ORGANIZATION_ID}/api/2025-04/graphql.json`;
    console.log('🌐 Making request to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': PARTNER_ACCESS_TOKEN!
      },
      body: JSON.stringify({ query: testQuery })
    });

    console.log('📊 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers));

    const responseText = await response.text();
    console.log('📄 Response body:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      if (data.errors) {
        console.log('❌ GraphQL errors:', data.errors);
      } else {
        console.log('✅ Partner API connection successful!');
        console.log('📊 Data received:', data);
      }
    } else {
      console.log('❌ HTTP error:', response.status, response.statusText);
    }

  } catch (error) {
    console.log('💥 Network error:', error);
  }
}

// Run the test
testPartnerAPI();