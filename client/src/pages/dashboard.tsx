import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UrlInput } from "@/components/url-input";
import { BuildStatus } from "@/components/build-status";
import { RevenueDashboard } from "@/components/revenue-dashboard";
import { 
  Store, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Eye,
  Settings,
  DollarSign,
  TrendingUp,
  Trash2
} from "lucide-react";

export default function Dashboard() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const activeProject = urlParams.get('project');

  const { data: projects, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/projects"],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const deleteStoreMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      refetch();
    },
  });

  const handleDeleteStore = async (projectId: string, storeName: string) => {
    if (window.confirm(`Are you sure you want to delete "${storeName}"? This action cannot be undone.`)) {
      try {
        await deleteStoreMutation.mutateAsync(projectId);
      } catch (error) {
        alert("Failed to delete store. Please try again.");
      }
    }
  };

  // Auto-refresh projects every 10 seconds to show new stores
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100";
      case "failed": return "text-red-600 bg-red-100";
      case "processing": return "text-blue-600 bg-blue-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "failed": return <AlertCircle className="h-4 w-4" />;
      case "processing": return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container-max">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <Store className="text-white text-sm" />
              </div>
              <span className="text-xl font-bold text-gray-900">StoreForge AI</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost">Back to Home</Button>
              </Link>
              <Link href="/connect-shopify">
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Connect Shopify
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container-max section-padding">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Create New Store */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Create New Store</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UrlInput />
              </CardContent>
            </Card>

            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Stores</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetch()}
                    className="h-8 px-2"
                  >
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : projects && projects.length > 0 ? (
                  <div className="space-y-3">
                    {projects.map((project: any) => (
                      <div 
                        key={project.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          activeProject === project.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => window.history.pushState({}, '', `/dashboard?project=${project.id}`)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm truncate">
                            {project.storeName || 'Untitled Store'}
                          </h4>
                          <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                            {getStatusIcon(project.status)}
                            <span className="ml-1">{project.status}</span>
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-500 truncate">
                          {project.productUrl}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {new Date(project.createdAt).toLocaleDateString()}
                          </span>
                          
                          <div className="flex space-x-1">
                            {project.status === "completed" && project.shopifyUrl && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(project.shopifyUrl, '_blank');
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                                <Link href={`/store/${project.id}`}>
                                  <Button
                                    size="sm"
                                    variant="ghost" 
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </Link>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStore(project.id, project.storeName || 'Untitled Store');
                              }}
                              disabled={deleteStoreMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">No stores created yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Create your first store using the form above
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="stores" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stores" className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Store Builder
                </TabsTrigger>
                <TabsTrigger value="revenue" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Revenue Dashboard
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="stores" className="space-y-4">
                {activeProject ? (
                  <BuildStatus projectId={activeProject} />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Welcome to StoreForge AI</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center py-12">
                        <Store className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Ready to build your first store?
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          Paste any product URL to get started. Our AI will handle the rest, creating a professional Shopify store in minutes.
                        </p>
                    
                    <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-blue-600 font-bold">1</span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">Paste URL</h4>
                        <p className="text-sm text-gray-600">Add your product link</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-purple-600 font-bold">2</span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">AI Builds</h4>
                        <p className="text-sm text-gray-600">Watch the magic happen</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-green-600 font-bold">3</span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">Store Ready</h4>
                        <p className="text-sm text-gray-600">Start selling immediately</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">What's Included</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Professional Shopify theme
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          AI-generated product copy
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Optimized product images
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Payment & shipping setup
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Supported Platforms</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Amazon</Badge>
                        <Badge variant="secondary">AliExpress</Badge>
                        <Badge variant="secondary">Shopify</Badge>
                        <Badge variant="secondary">eBay</Badge>
                        <Badge variant="secondary">Walmart</Badge>
                        <Badge variant="secondary">500+ more</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
              </TabsContent>
              
              <TabsContent value="revenue" className="space-y-4">
                <RevenueDashboard />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
