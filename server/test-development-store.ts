// Test creating a development store with the Partner API
import fetch from 'node-fetch';

const ORGANIZATION_ID = process.env.SHOPIFY_PARTNER_ORG_ID;
const PARTNER_ACCESS_TOKEN = process.env.SHOPIFY_PARTNER_API_SECRET;

async function testDevelopmentStoreCreation() {
  console.log('🏪 Testing development store creation...');

  // Query to create a development store
  const createStoreQuery = `
    mutation developmentStoreCreate($input: DevelopmentStoreInput!) {
      developmentStoreCreate(input: $input) {
        store {
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

  const variables = {
    input: {
      name: "StormForge Test Store",
      domain: "stormforge-test-" + Date.now(),
      purpose: "Create a store to test and build"
    }
  };

  try {
    const url = `https://partners.shopify.com/${ORGANIZATION_ID}/api/2025-04/graphql.json`;
    
    console.log('📋 Creating store with variables:', variables);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': PARTNER_ACCESS_TOKEN!
      },
      body: JSON.stringify({ 
        query: createStoreQuery,
        variables 
      })
    });

    console.log('📊 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      
      if (data.errors) {
        console.log('❌ GraphQL errors:', data.errors);
      } else if (data.data?.developmentStoreCreate?.userErrors?.length > 0) {
        console.log('❌ User errors:', data.data.developmentStoreCreate.userErrors);
      } else {
        console.log('🎉 SUCCESS! Development store created!');
        console.log('📊 Store data:', data.data.developmentStoreCreate.store);
      }
    } else {
      console.log('❌ HTTP error:', response.status, response.statusText);
    }

  } catch (error) {
    console.log('💥 Network error:', error);
  }
}

// Also test listing existing stores
async function testListStores() {
  console.log('\n📋 Testing list stores...');

  const listStoresQuery = `
    query {
      stores(first: 10) {
        edges {
          node {
            id
            name
            myshopifyDomain
            url
          }
        }
      }
    }
  `;

  try {
    const url = `https://partners.shopify.com/${ORGANIZATION_ID}/api/2025-04/graphql.json`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': PARTNER_ACCESS_TOKEN!
      },
      body: JSON.stringify({ query: listStoresQuery })
    });

    const responseText = await response.text();
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      
      if (data.errors) {
        console.log('❌ GraphQL errors:', data.errors);
      } else {
        console.log('✅ Stores retrieved successfully!');
        console.log('📊 Store count:', data.data?.stores?.edges?.length || 0);
        data.data?.stores?.edges?.forEach((edge: any, index: number) => {
          console.log(`🏪 Store ${index + 1}:`, edge.node);
        });
      }
    } else {
      console.log('❌ HTTP error:', response.status, response.statusText);
    }

  } catch (error) {
    console.log('💥 Network error:', error);
  }
}

// Run both tests
async function runTests() {
  await testListStores();
  await testDevelopmentStoreCreation();
}

runTests();