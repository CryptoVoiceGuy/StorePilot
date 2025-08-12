import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StoreMockup } from "@/components/store-mockup";
import { 
  ArrowLeft, 
  ExternalLink, 
  Settings, 
  Download,
  Share,
  Eye
} from "lucide-react";

interface Project {
  id: string;
  status: string;
  storeName: string | null;
  shopifyUrl: string | null;
  adminUrl: string | null;
  productData: any;
  generatedContent: any;
  productUrl: string;
}

export default function StorePreview() {
  const { id } = useParams();

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["/api/status", id],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project || project.status !== "completed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Store Not Ready</h2>
            <p className="text-gray-600 mb-4">
              This store is not yet available for preview.
            </p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container-max">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="font-semibold text-gray-900">{project.storeName}</h1>
                <Badge variant="secondary" className="text-xs">
                  <Eye className="mr-1 h-3 w-3" />
                  Preview Mode
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(project.shopifyUrl, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Live Store
              </Button>
              <Button
                variant="outline"
                size="sm" 
                onClick={() => window.open(project.adminUrl, '_blank')}
              >
                <Settings className="mr-2 h-4 w-4" />
                Admin
              </Button>
              <Button variant="outline" size="sm">
                <Share className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Store Preview */}
      <div className="container-max section-padding">
        <div className="max-w-6xl mx-auto">
          {/* Preview Info */}
          <div className="mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">Store Preview</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    This is a preview of your generated store. You can make changes in the Shopify admin panel.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Store Mockup */}
          <StoreMockup 
            productData={project.productData}
            generatedContent={project.generatedContent}
          />

          {/* Store Details */}
          <div className="mt-8 grid md:grid-cols-2 gap-8">
            {/* Product Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Product Information</h3>
                
                {project.productData && (
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Original URL:</span>
                      <p className="text-gray-600 break-all">{project.productUrl}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Title:</span>
                      <p className="text-gray-600">{project.productData.title}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Price:</span>
                      <p className="text-gray-600">{project.productData.price}</p>
                    </div>
                    
                    {project.productData.brand && (
                      <div>
                        <span className="font-medium text-gray-700">Brand:</span>
                        <p className="text-gray-600">{project.productData.brand}</p>
                      </div>
                    )}
                    
                    {project.productData?.features && project.productData.features.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">Features:</span>
                        <ul className="text-gray-600 list-disc list-inside mt-1">
                          {project.productData.features.slice(0, 3).map((feature: string, index: number) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generated Content */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">AI-Generated Content</h3>
                
                {project.generatedContent && (
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Store Name:</span>
                      <p className="text-gray-600">{project.generatedContent.brandName}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Hero Headline:</span>
                      <p className="text-gray-600">{project.generatedContent.heroHeadline}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Brand Colors:</span>
                      <div className="flex space-x-2 mt-1">
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: project.generatedContent.brandColors?.primary }}
                          title="Primary"
                        ></div>
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: project.generatedContent.brandColors?.secondary }}
                          title="Secondary"
                        ></div>
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: project.generatedContent.brandColors?.accent }}
                          title="Accent"
                        ></div>
                      </div>
                    </div>
                    
                    {project.generatedContent?.features && (
                      <div>
                        <span className="font-medium text-gray-700">Marketing Features:</span>
                        <ul className="text-gray-600 list-disc list-inside mt-1">
                          {project.generatedContent.features.slice(0, 3).map((feature: string, index: number) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center space-x-4">
            <Button 
              size="lg"
              onClick={() => window.open(project.shopifyUrl, '_blank')}
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              View Live Store
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => window.open(project.adminUrl, '_blank')}
            >
              <Settings className="mr-2 h-5 w-5" />
              Customize Store
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
