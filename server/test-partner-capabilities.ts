// Test what we CAN do with the Partner API
import fetch from 'node-fetch';

const ORGANIZATION_ID = process.env.SHOPIFY_PARTNER_ORG_ID;
const PARTNER_ACCESS_TOKEN = process.env.SHOPIFY_PARTNER_API_SECRET;

async function testPartnerCapabilities() {
  console.log('🧪 Testing Partner API capabilities...');

  const queries = [
    {
      name: 'Organization Info',
      query: `
        query {
          organization {
            id
            name
            website
          }
        }
      `
    },
    {
      name: 'Apps List', 
      query: `
        query {
          apps(first: 5) {
            edges {
              node {
                id
                name
                status
              }
            }
          }
        }
      `
    },
    {
      name: 'Transactions',
      query: `
        query {
          transactions(first: 5) {
            edges {
              node {
                id
                createdAt
                netAmount {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      `
    }
  ];

  for (const test of queries) {
    console.log(`\n🔍 Testing: ${test.name}`);
    
    try {
      const response = await fetch(
        `https://partners.shopify.com/${ORGANIZATION_ID}/api/2025-04/graphql.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': PARTNER_ACCESS_TOKEN!
          },
          body: JSON.stringify({ query: test.query })
        }
      );

      const data = await response.json();
      
      if (data.errors) {
        console.log('❌ Errors:', data.errors);
      } else {
        console.log('✅ Success!', JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.log('💥 Error:', error);
    }
  }
}

testPartnerCapabilities();