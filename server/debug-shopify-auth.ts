// Debug script to test different Shopify Partner API authentication methods
import fetch from 'node-fetch';

const CLIENT_ID = process.env.SHOPIFY_PARTNER_API_KEY;
const CLIENT_SECRET = process.env.SHOPIFY_PARTNER_API_SECRET;
const ORG_ID = process.env.SHOPIFY_PARTNER_ORG_ID;

console.log('🔍 Debugging Shopify Partner API Authentication...\n');

console.log('Environment Variables:');
console.log('CLIENT_ID:', CLIENT_ID ? `${CLIENT_ID.substring(0, 8)}...` : 'NOT SET');
console.log('CLIENT_SECRET:', CLIENT_SECRET ? `${CLIENT_SECRET.substring(0, 8)}...` : 'NOT SET');
console.log('ORG_ID:', ORG_ID || 'NOT SET');
console.log();

async function testMethod1_DirectSecret() {
  console.log('🧪 Method 1: Using Client Secret as Access Token');
  
  try {
    const query = `query { 
      currentAppInstallation { 
        app { id title } 
      } 
    }`;

    const response = await fetch(`https://partners.shopify.com/${ORG_ID}/api/2023-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': CLIENT_SECRET,
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

async function testMethod2_BasicAuth() {
  console.log('\n🧪 Method 2: Basic Authentication');
  
  try {
    const query = `query { 
      currentAppInstallation { 
        app { id title } 
      } 
    }`;

    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const response = await fetch(`https://partners.shopify.com/${ORG_ID}/api/2023-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
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

async function testMethod3_ClientCredentials() {
  console.log('\n🧪 Method 3: OAuth Client Credentials Flow');
  
  try {
    // Step 1: Get access token using client credentials
    console.log('Getting access token...');
    
    const tokenResponse = await fetch('https://partners.shopify.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    console.log('Token Status:', tokenResponse.status);
    const tokenResult = await tokenResponse.json();
    console.log('Token Response:', JSON.stringify(tokenResult, null, 2));

    if (tokenResult.access_token) {
      // Step 2: Use the access token for GraphQL query
      console.log('\nUsing access token for GraphQL...');
      
      const query = `query { 
        currentAppInstallation { 
          app { id title } 
        } 
      }`;

      const response = await fetch(`https://partners.shopify.com/${ORG_ID}/api/2023-07/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': tokenResult.access_token,
        },
        body: JSON.stringify({ query }),
      });

      console.log('GraphQL Status:', response.status);
      const result = await response.json();
      console.log('GraphQL Response:', JSON.stringify(result, null, 2));
      return result;
    }

    return tokenResult;

  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function testMethod4_DifferentEndpoint() {
  console.log('\n🧪 Method 4: Different API Endpoint');
  
  try {
    const query = `query { 
      apps(first: 5) {
        edges {
          node {
            id
            title
          }
        }
      }
    }`;

    const response = await fetch(`https://partners.shopify.com/${ORG_ID}/api/2023-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': CLIENT_SECRET,
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

async function runAllTests() {
  if (!CLIENT_ID || !CLIENT_SECRET || !ORG_ID) {
    console.log('❌ Missing required environment variables');
    return;
  }

  await testMethod1_DirectSecret();
  await testMethod2_BasicAuth();
  await testMethod3_ClientCredentials();
  await testMethod4_DifferentEndpoint();

  console.log('\n📋 Summary:');
  console.log('If Method 3 (Client Credentials) worked, we need to implement OAuth flow');
  console.log('If none worked, we may need to generate an access token from Partner Dashboard');
}

runAllTests().catch(console.error);