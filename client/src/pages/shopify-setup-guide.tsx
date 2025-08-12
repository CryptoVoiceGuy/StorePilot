import { useState } from "react";
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
  ArrowRight,
  Copy,
  AlertTriangle
} from "lucide-react";

const steps = [
  {
    title: "Access Shopify Partners Dashboard",
    description: "Log into your existing Shopify Partners account",
    action: "Go to https://partners.shopify.com",
    details: [
      "Use your existing login credentials",
      "You should see your organization dashboard",
      "Look for the 'Apps' section in the sidebar"
    ]
  },
  {
    title: "Create Partner API App",
    description: "Create a new app specifically for Partner API access",
    action: "Click 'Apps' → 'Create app' → Choose 'Partner API'",
    details: [
      "NOT 'Custom app' or 'Public app'",
      "App name: 'AI Store Builder' (or your choice)",
      "App URL: Can be temporary like https://example.com",
      "Contact email: Your email address"
    ]
  },
  {
    title: "Configure API Permissions",
    description: "Request the necessary scopes for development store management",
    action: "In app settings, find 'API access' section",
    details: [
      "read_apps and write_apps",
      "read_app_installations and write_app_installations", 
      "read_development_stores and write_development_stores",
      "These permissions allow creating and managing stores"
    ]
  },
  {
    title: "Generate Access Token",
    description: "Create the access token we need for authentication",
    action: "Find 'Access tokens' → 'Generate access token'",
    details: [
      "Copy this token immediately - you won't see it again",
      "This replaces your current API secret",
      "Keep it secure and don't share it publicly"
    ]
  },
  {
    title: "Update Credentials",
    description: "Replace the current credentials with the new Partner API values",
    action: "Update the three environment variables",
    details: [
      "SHOPIFY_PARTNER_API_KEY: New Client ID from Partner API app",
      "SHOPIFY_PARTNER_API_SECRET: The Access Token you just generated",
      "SHOPIFY_PARTNER_ORG_ID: Keep the same (4441682)"
    ]
  }
];

export default function ShopifySetupGuide() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentCredentials, setCurrentCredentials] = useState({
    apiKey: "c108f94ddb7f06cf1903ea6c127c207f",
    apiSecret: "900405d7ab11a5ff0ae329bb9b5bfc5d",
    orgId: "4441682"
  });

  const toggleStep = (stepIndex: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepIndex) 
        ? prev.filter(i => i !== stepIndex)
        : [...prev, stepIndex]
    );
  };

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
                <Store className="text-white text-sm" />
              </div>
              <span className="text-xl font-bold text-gray-900">Partner API Setup Guide</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container-max section-padding">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
                  ></div>
                </div>
                <Badge variant={completedSteps.length === steps.length ? "default" : "secondary"}>
                  {completedSteps.length} of {steps.length} completed
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Current vs Required Credentials */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span>Current Credentials (Custom App)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Key:</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(currentCredentials.apiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <code className="text-xs text-gray-600">{currentCredentials.apiKey}</code>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Secret:</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(currentCredentials.apiSecret)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <code className="text-xs text-gray-600">{currentCredentials.apiSecret}</code>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Org ID:</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(currentCredentials.orgId)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <code className="text-xs text-gray-600">{currentCredentials.orgId}</code>
                </div>
                
                <div className="text-xs text-red-600 mt-2">
                  ❌ These credentials are for individual store access, not for creating new stores
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Required Credentials (Partner API)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-green-50 rounded-lg p-3">
                  <span className="text-sm font-medium">API Key:</span>
                  <div className="text-xs text-gray-600 mt-1">
                    New Client ID from Partner API app
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3">
                  <span className="text-sm font-medium">Access Token:</span>
                  <div className="text-xs text-gray-600 mt-1">
                    Generated access token (replaces API secret)
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3">
                  <span className="text-sm font-medium">Org ID:</span>
                  <div className="text-xs text-gray-600 mt-1">
                    Same as current: {currentCredentials.orgId}
                  </div>
                </div>
                
                <div className="text-xs text-green-600 mt-2">
                  ✅ These credentials will allow creating and managing development stores
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Step-by-Step Guide */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Step-by-Step Instructions</h2>
            
            {steps.map((step, index) => (
              <Card key={index} className={`transition-all duration-200 ${
                completedSteps.includes(index) ? 'border-green-500 bg-green-50' : 'hover:shadow-md'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        completedSteps.includes(index) 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {completedSteps.includes(index) ? '✓' : index + 1}
                      </div>
                      <span className={completedSteps.includes(index) ? 'text-green-800' : ''}>
                        {step.title}
                      </span>
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStep(index)}
                    >
                      {completedSteps.includes(index) ? 'Mark Incomplete' : 'Mark Complete'}
                    </Button>
                  </div>
                  <p className={`text-sm ml-11 ${
                    completedSteps.includes(index) ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    {step.description}
                  </p>
                </CardHeader>
                <CardContent className="ml-11">
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <ArrowRight className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Action:</span>
                      </div>
                      <p className="text-blue-700 text-sm mt-1">{step.action}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 text-sm">Details:</h4>
                      <ul className="space-y-1">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="text-sm text-gray-600 flex items-start space-x-2">
                            <span className="text-gray-400 mt-1">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              className="flex-1"
              onClick={() => window.open('https://partners.shopify.com', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Shopify Partners Dashboard
            </Button>
            
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/shopify-status">
                <Key className="mr-2 h-4 w-4" />
                Test New Credentials
              </Link>
            </Button>
          </div>

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Can't Create Partner API App?</h4>
                <p className="text-yellow-700 text-sm mb-3">
                  Some Shopify Partners accounts need special approval for Partner API access.
                </p>
                <Button variant="outline" size="sm" className="text-yellow-700 border-yellow-300">
                  Contact Shopify Partner Support
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>
                  If you get stuck at any step, you can continue using the demo mode while we work 
                  on getting the proper credentials. The AI store builder works perfectly for testing 
                  and demonstrations.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}