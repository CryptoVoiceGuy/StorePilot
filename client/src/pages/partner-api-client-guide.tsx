import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  ExternalLink,
  Store,
  Key,
  Settings,
  CheckCircle,
  AlertTriangle,
  Target
} from "lucide-react";

export default function PartnerAPIClientGuide() {
  const [currentStep, setCurrentStep] = useState(1);

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
              <span className="text-xl font-bold text-gray-900">Partner API Client Setup</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container-max section-padding">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Critical Discovery */}
          <Card className="border-red-500 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span>Important Discovery!</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-red-700">
                <p className="font-semibold mb-2">We've been in the wrong place this entire time!</p>
                <p className="mb-4">
                  Your app credentials are for accessing individual stores. To create development stores, 
                  we need a completely different type of authentication called a <strong>Partner API Client</strong>.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <h4 className="font-medium text-red-800 mb-2">❌ What We Have (Wrong)</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• App credentials from "Apps" section</li>
                    <li>• Client ID & Secret for store access</li>
                    <li>• Refresh tokens for store APIs</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-green-500">
                  <h4 className="font-medium text-green-800 mb-2">✅ What We Need (Right)</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Partner API Client from "Settings"</li>
                    <li>• Partner access token</li>
                    <li>• Permissions for development stores</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* The Real Solution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span>The Correct Solution - Partner API Client</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Step 1 */}
              <div className={`border-l-4 pl-4 ${currentStep === 1 ? 'border-blue-500' : 'border-gray-300'}`}>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Step 1: Go to Settings (NOT Apps)</span>
                </h3>
                <p className="text-gray-700 text-sm mb-3">
                  In your Partner Dashboard, click on <strong>"Settings"</strong> in the left sidebar.
                  This is a completely different section from where we were before.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Partner Dashboard → <strong>Settings</strong> → Partner API clients
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-3"
                  onClick={() => setCurrentStep(2)}
                >
                  I found Settings →
                </Button>
              </div>

              {/* Step 2 */}
              <div className={`border-l-4 pl-4 ${currentStep === 2 ? 'border-blue-500' : 'border-gray-300'}`}>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Step 2: Find "Partner API clients"
                </h3>
                <p className="text-gray-700 text-sm mb-3">
                  In the Settings page, look for <strong>"Partner API clients"</strong> section.
                  Click on <strong>"Manage Partner API clients"</strong>.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This is different from the "Apps" section we were in before!
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-3"
                  onClick={() => setCurrentStep(3)}
                >
                  Found Partner API clients →
                </Button>
              </div>

              {/* Step 3 */}
              <div className={`border-l-4 pl-4 ${currentStep === 3 ? 'border-blue-500' : 'border-gray-300'}`}>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Step 3: Create New Partner API Client
                </h3>
                <p className="text-gray-700 text-sm mb-3">
                  Click the button to create a new Partner API client. Give it a name like:
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <code className="text-sm">StormForge Development Store Creator</code>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-3"
                  onClick={() => setCurrentStep(4)}
                >
                  Created new client →
                </Button>
              </div>

              {/* Step 4 */}
              <div className={`border-l-4 pl-4 ${currentStep === 4 ? 'border-blue-500' : 'border-gray-300'}`}>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Step 4: Set Permissions
                </h3>
                <p className="text-gray-700 text-sm mb-3">
                  Select these permissions for your Partner API client:
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>☑️ <strong>Manage apps</strong> - For app-related operations</li>
                    <li>☑️ <strong>View financials</strong> - Optional, for earnings data</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Note: Development store creation is included with "Manage apps" permission
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-3"
                  onClick={() => setCurrentStep(5)}
                >
                  Set permissions →
                </Button>
              </div>

              {/* Step 5 */}
              <div className={`border-l-4 pl-4 ${currentStep === 5 ? 'border-green-500' : 'border-gray-300'}`}>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Step 5: Copy the Access Token!</span>
                </h3>
                <p className="text-gray-700 text-sm mb-3">
                  After creating the client, you'll get a <strong>Partner API access token</strong>.
                  This is what we need!
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    ⚠️ <strong>CRITICAL:</strong> Copy this token immediately! 
                    You won't be able to see it again.
                  </p>
                </div>
                <p className="text-sm text-gray-700 mt-3">
                  The token will look something like: <code className="bg-gray-100 px-1">pat_abc123xyz...</code>
                </p>
              </div>

            </CardContent>
          </Card>

          {/* What to Do Next */}
          <Card>
            <CardHeader>
              <CardTitle>After You Get the Partner API Token</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Once you have the Partner API access token from Settings → Partner API clients:
              </p>
              
              <ol className="space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span className="text-gray-700">Update SHOPIFY_PARTNER_API_SECRET with this new token</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span className="text-gray-700">Keep your existing SHOPIFY_PARTNER_API_KEY and ORG_ID</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span className="text-gray-700">Test the connection - it should work now!</span>
                </li>
              </ol>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">This Will Finally Allow Us To:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Create real development stores programmatically</li>
                  <li>• Install products and themes on those stores</li>
                  <li>• Transfer store ownership to customers</li>
                  <li>• Access Partner Dashboard data via API</li>
                </ul>
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
              Go to Partner Dashboard Settings
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