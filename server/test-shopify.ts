// Test script to verify Shopify Partner API integration
import fetch from 'node-fetch';

const SHOPIFY_PARTNER_API_KEY = "c108f94ddb7f06cf1903ea6c127c207f";
const SHOPIFY_PARTNER_API_SECRET = "900405d7ab11a5ff0ae329bb9b5bfc5d";
const SHOPIFY_PARTNER_ORG_ID = "4441682";

async function testShopifyAPI() {
  try {
    console.log('Testing Shopify Partner API connection...');
    
    // Test query to get organization info
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

    const response = await fetch(`https://partners.shopify.com/${SHOPIFY_PARTNER_ORG_ID}/api/2023-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_PARTNER_API_SECRET,
      },
      body: JSON.stringify({
        query
      }),
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('API Response:', JSON.stringify(result, null, 2));

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return false;
    }

    console.log('✅ Shopify Partner API connection successful!');
    return true;

  } catch (error) {
    console.error('❌ Shopify API test failed:', error);
    return false;
  }
}

async function createTestStore() {
  try {
    console.log('\nTesting development store creation...');
    
    const createStoreQuery = `
      mutation appDevelopmentStoreCreate($input: AppDevelopmentStoreInput!) {
        appDevelopmentStoreCreate(input: $input) {
          appDevelopmentStore {
            id
            name
            myshopifyDomain
            url
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const storeInput = {
      name: "AI Builder Test Store",
      transferDisabled: false,
      buildForTheme: true
    };

    const response = await fetch(`https://partners.shopify.com/${SHOPIFY_PARTNER_ORG_ID}/api/2023-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_PARTNER_API_SECRET,
      },
      body: JSON.stringify({
        query: createStoreQuery,
        variables: { input: storeInput }
      }),
    });

    const result = await response.json();
    console.log('Store creation result:', JSON.stringify(result, null, 2));

    if (result.data?.appDevelopmentStoreCreate?.userErrors?.length > 0) {
      console.error('Store creation errors:', result.data.appDevelopmentStoreCreate.userErrors);
      return null;
    }

    const store = result.data?.appDevelopmentStoreCreate?.appDevelopmentStore;
    if (store) {
      console.log('✅ Test store created successfully!');
      console.log(`Store URL: https://${store.myshopifyDomain}`);
      console.log(`Admin URL: https://${store.myshopifyDomain}/admin`);
      return store;
    }

    return null;

  } catch (error) {
    console.error('❌ Store creation test failed:', error);
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Shopify Partner API tests...\n');
  
  const apiConnected = await testShopifyAPI();
  
  if (apiConnected) {
    const store = await createTestStore();
    if (store) {
      console.log('\n🎉 All tests passed! Real Shopify integration is working.');
    } else {
      console.log('\n⚠️  API connected but store creation failed. Check permissions.');
    }
  } else {
    console.log('\n❌ API connection failed. Check credentials.');
  }
}

runTests().catch(console.error);