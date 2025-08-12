import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Store,
  Key,
  Globe,
  Settings
} from "lucide-react";

export default function ConnectShopify() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container-max">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <Store className="text-white text-sm" />
              </div>
              <span className="text-xl font-bold text-gray-900">StoreForge AI</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container-max section-padding">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Connect Your Shopify Account
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              To create real Shopify stores, we need to connect to your Shopify Partner account. 
              This allows us to automatically create and transfer development stores to your customers.
            </p>
          </div>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Connection Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Demo Mode Active</h4>
                    <p className="text-sm text-yellow-700">
                      Currently showing mock stores. Connect Shopify Partner API to create real stores.
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Demo Mode
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Integration Requirements */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Requirements</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Shopify Partner Account</h4>
                      <p className="text-sm text-gray-600">
                        Create a free Shopify Partner account to access the Partner API
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Partner API Access</h4>
                      <p className="text-sm text-gray-600">
                        Generate API credentials for automated store creation
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Store Transfer Setup</h4>
                      <p className="text-sm text-gray-600">
                        Configure automatic store transfer to customer accounts
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={() => window.open('https://partners.shopify.com', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Create Shopify Partner Account
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>How It Works</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">Development Store Creation</h4>
                    <p className="text-sm text-gray-600">
                      Partner API creates a new development store for each build
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">Automated Setup</h4>
                    <p className="text-sm text-gray-600">
                      Products, theme, and content are automatically installed
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">Store Transfer</h4>
                    <p className="text-sm text-gray-600">
                      Ownership is transferred to the customer's Shopify account
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>API Configuration (Production Setup)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h4 className="font-semibold text-gray-900">Required Environment Variables:</h4>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between items-center p-2 bg-white rounded border">
                    <span>SHOPIFY_PARTNER_API_KEY</span>
                    <Badge variant="outline">Required</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded border">
                    <span>SHOPIFY_PARTNER_API_SECRET</span>
                    <Badge variant="outline">Required</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded border">
                    <span>SHOPIFY_PARTNER_ORG_ID</span>
                    <Badge variant="outline">Required</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded border">
                    <span>SHOPIFY_WEBHOOK_SECRET</span>
                    <Badge variant="outline">Optional</Badge>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-4">
                    Once configured, the system will create real Shopify development stores 
                    that can be transferred to customers or published directly.
                  </p>
                  
                  <Button variant="outline" disabled className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure Production API (Contact Developer)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Demo Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Current Demo Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-800 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Working Features
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Product URL scraping</li>
                    <li>• AI content generation</li>
                    <li>• Store preview and mockups</li>
                    <li>• Brand name and color generation</li>
                    <li>• Professional product descriptions</li>
                    <li>• FAQ generation</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-yellow-800 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Requires Shopify Integration
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Real store creation</li>
                    <li>• Live product publishing</li>
                    <li>• Payment gateway setup</li>
                    <li>• Domain configuration</li>
                    <li>• Store ownership transfer</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}