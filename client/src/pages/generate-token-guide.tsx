import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  ExternalLink,
  Store,
  Key,
  Copy,
  CheckCircle
} from "lucide-react";

export default function GenerateTokenGuide() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container-max">
          <div className="flex justify-between items-center h-16">
            <Link href="/shopify-status" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Status</span>
            </Link>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <Key className="text-white text-sm" />
              </div>
              <span className="text-xl font-bold text-gray-900">Generate Access Token</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container-max section-padding">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Current Situation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Good News - Your App is Already Correct!</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Your Partners API app is set up correctly. We just need to generate an access token 
                from your existing app to make API calls.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">What You Have:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Partners API app (correct type)</li>
                  <li>• Client ID and Client Secret</li>
                  <li>• Organization access</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">What We Need:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Access token generated from your existing app</li>
                  <li>• This token allows direct API calls</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Step-by-Step Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Access Token from Your Existing App</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Step 1 */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Step 1: Find Your Partners API App
                </h3>
                <p className="text-gray-700 text-sm mb-3">
                  Go to your Shopify Partners dashboard and locate your existing Partners API app.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://partners.shopify.com/apps', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Partners Dashboard - Apps
                </Button>
              </div>

              {/* Step 2 */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Step 2: Access App Settings
                </h3>
                <p className="text-gray-700 text-sm mb-3">
                  Click on your Partners API app to open its settings page.
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">
                    Look for your app with Client ID: <code className="bg-gray-200 px-1 rounded">c108f94d...</code>
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Step 3: Generate Access Token
                </h3>
                <p className="text-gray-700 text-sm mb-3">
                  In your app settings, look for one of these sections:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 mb-3">
                  <li>• "Access Tokens"</li>
                  <li>• "API Access"</li>
                  <li>• "Credentials"</li>
                  <li>• "Generate Token"</li>
                </ul>
                <p className="text-gray-700 text-sm">
                  Click "Generate Access Token" or similar button.
                </p>
              </div>

              {/* Step 4 */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Step 4: Configure Token Permissions
                </h3>
                <p className="text-gray-700 text-sm mb-3">
                  When generating the token, make sure it has these permissions:
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• <strong>read_apps</strong> - View apps</li>
                    <li>• <strong>write_apps</strong> - Manage apps</li>
                    <li>• <strong>read_development_stores</strong> - View dev stores</li>
                    <li>• <strong>write_development_stores</strong> - Create dev stores</li>
                  </ul>
                </div>
              </div>

              {/* Step 5 */}
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Step 5: Copy the Access Token
                </h3>
                <p className="text-gray-700 text-sm mb-3">
                  Copy the generated access token. It will look something like:
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <code className="text-xs text-gray-600">shpat_1a2b3c4d5e6f7g8h9i0j...</code>
                </div>
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Save this token immediately - you won't be able to see it again!
                </p>
              </div>

            </CardContent>
          </Card>

          {/* What to Do With the Token */}
          <Card>
            <CardHeader>
              <CardTitle>Update Your Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Once you have the access token, you'll update just one environment variable:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Keep the Same:</h4>
                  <div className="bg-green-50 rounded-lg p-3 space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-green-800">SHOPIFY_PARTNER_API_KEY</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard("c108f94ddb7f06cf1903ea6c127c207f")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <code className="text-xs text-green-700">c108f94ddb7f06cf1903ea6c127c207f</code>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-green-800">SHOPIFY_PARTNER_ORG_ID</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard("4441682")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <code className="text-xs text-green-700">4441682</code>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Replace This One:</h4>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div>
                      <span className="text-xs font-medium text-blue-800">SHOPIFY_PARTNER_API_SECRET</span>
                      <div className="text-xs text-blue-700 mt-1">
                        Replace with your new access token
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">After You Get the Token:</h4>
                <ol className="text-sm text-yellow-700 space-y-1">
                  <li>1. Update SHOPIFY_PARTNER_API_SECRET with the access token</li>
                  <li>2. Go back to the Status page</li>
                  <li>3. Click "Retry Test" to verify the connection</li>
                  <li>4. If successful, you can create real Shopify stores!</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              className="flex-1"
              onClick={() => window.open('https://partners.shopify.com', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Go to Partners Dashboard
            </Button>
            
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/shopify-status">
                <Store className="mr-2 h-4 w-4" />
                Back to Status Page
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}