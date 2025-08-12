// Test the refresh token with different Partner API approaches
import fetch from 'node-fetch';

const CLIENT_ID = process.env.SHOPIFY_PARTNER_API_KEY;
const REFRESH_TOKEN = process.env.SHOPIFY_PARTNER_API_SECRET;
const ORG_ID = process.env.SHOPIFY_PARTNER_ORG_ID;

console.log('🔍 Testing Refresh Token Authentication...\n');

console.log('Environment Variables:');
console.log('CLIENT_ID:', CLIENT_ID ? `${CLIENT_ID.substring(0, 8)}...` : 'NOT SET');
console.log('REFRESH_TOKEN:', REFRESH_TOKEN ? `${REFRESH_TOKEN.substring(0, 8)}...` : 'NOT SET');
console.log('ORG_ID:', ORG_ID || 'NOT SET');
console.log();

async function testPartnerAPI() {
  console.log('🧪 Testing Partner API with Refresh Token');
  
  try {
    const query = `
      query {
        organizations(first: 1) {
          edges {
            node {
              id
              businessName
            }
          }
        }
      }
    `;

    const response = await fetch(`https://partners.shopify.com/api/2023-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': REFRESH_TOKEN,
      },
      body: JSON.stringify({ query }),
    });

    console.log('Status:', response.status);
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    return result;

  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function testDevelopmentStoreCreation() {
  console.log('\n🧪 Testing Development Store Creation');
  
  try {
    const query = `
      mutation {
        appDevelopmentStoreCreate(input: {
          name: "Test Store from API"
          transferDisabled: false
        }) {
          appDevelopmentStore {
            id
            name
            myshopifyDomain
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await fetch(`https://partners.shopify.com/api/2023-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': REFRESH_TOKEN,
      },
      body: JSON.stringify({ query }),
    });

    console.log('Status:', response.status);
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    return result;

  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function testWithOrgIdInURL() {
  console.log('\n🧪 Testing with Organization ID in URL');
  
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

    const response = await fetch(`https://partners.shopify.com/${ORG_ID}/api/2023-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': REFRESH_TOKEN,
      },
      body: JSON.stringify({ query }),
    });

    console.log('Status:', response.status);
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    return result;

  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function runTests() {
  if (!CLIENT_ID || !REFRESH_TOKEN || !ORG_ID) {
    console.log('❌ Missing required environment variables');
    return;
  }

  await testPartnerAPI();
  await testDevelopmentStoreCreation();
  await testWithOrgIdInURL();

  console.log('\n📋 Summary:');
  console.log('Testing different Partner API endpoints and approaches with refresh token.');
}

runTests().catch(console.error);