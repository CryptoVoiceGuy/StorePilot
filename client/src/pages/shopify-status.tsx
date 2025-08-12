import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Store,
  Key,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

export default function ShopifyStatus() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-shopify');
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: 'Connection test failed' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container-max">
          <div className="flex justify-between items-center h-16">
            <Link href="/connect-shopify" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Setup</span>
            </Link>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <Store className="text-white text-sm" />
              </div>
              <span className="text-xl font-bold text-gray-900">Shopify Integration Status</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container-max section-padding">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Connection Test Results */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>API Connection Test</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testConnection}
                  disabled={isLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Testing...' : 'Retry Test'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {testResult ? (
                <div className="space-y-4">
                  <div className={`flex items-center space-x-3 p-4 rounded-lg border ${
                    testResult.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                    <div>
                      <h4 className={`font-medium ${
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                      </h4>
                      <p className={`text-sm ${
                        testResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {testResult.message || testResult.error || 'API connection test completed'}
                      </p>
                    </div>
                  </div>

                  {testResult.details && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Technical Details</h4>
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(testResult.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Issue Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Integration Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Authentication Issue Detected</h4>
                <p className="text-yellow-700 text-sm mb-3">
                  The current app type (Custom App) doesn't have the required permissions for Partner API operations.
                </p>
                
                <div className="space-y-2">
                  <h5 className="font-medium text-yellow-800">Required App Type:</h5>
                  <ul className="text-sm text-yellow-700 space-y-1 ml-4">
                    <li>• <strong>Partner API App</strong> (not Custom App)</li>
                    <li>• Development store creation permissions</li>
                    <li>• Partner dashboard access token</li>
                  </ul>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">What You Have</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Custom App credentials</li>
                    <li>• API Key & Secret</li>
                    <li>• Organization ID</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">What You Need</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Partner API App</li>
                    <li>• Access Token with right scopes</li>
                    <li>• Development store permissions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps for Real Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Create Partner API App</h4>
                    <p className="text-sm text-gray-600">
                      In your Shopify Partners dashboard, create a new app specifically for "Partner API" usage
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Generate Access Token</h4>
                    <p className="text-sm text-gray-600">
                      Request the proper scopes for development store creation and management
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Update Configuration</h4>
                    <p className="text-sm text-gray-600">
                      Replace current credentials with the Partner API access token
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <Link href="/shopify-setup-guide" className="w-full">
                  <Button className="w-full">
                    <Key className="mr-2 h-4 w-4" />
                    View Detailed Setup Guide
                  </Button>
                </Link>
                
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={() => window.open('https://partners.shopify.com', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Go to Shopify Partners Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Demo Mode Notice */}
          <Card>
            <CardHeader>
              <CardTitle>Current Demo Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Fully Functional Demo</h4>
                <p className="text-blue-700 text-sm mb-3">
                  While we work on the real Shopify integration, your AI store builder is fully operational 
                  with all the core features working perfectly:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-blue-800 mb-1">Working Features:</h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Product URL scraping</li>
                      <li>• AI content generation</li>
                      <li>• Brand name & color creation</li>
                      <li>• Professional copywriting</li>
                      <li>• Store mockups & previews</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-blue-800 mb-1">Ready to Add:</h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Real Shopify store creation</li>
                      <li>• Product publishing</li>
                      <li>• Store ownership transfer</li>
                      <li>• Payment gateway setup</li>
                    </ul>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-blue-200 mt-3">
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full">
                      <Store className="mr-2 h-4 w-4" />
                      Continue Using Demo Mode
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}