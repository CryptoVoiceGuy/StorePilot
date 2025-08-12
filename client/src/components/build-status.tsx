import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Copy,
  Eye 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BuildStatusProps {
  projectId: string;
}

interface Project {
  id: string;
  status: string;
  storeName: string | null;
  shopifyUrl: string | null;
  adminUrl: string | null;
  productData: any;
  generatedContent: any;
  logs: Array<{ step: string; message: string; timestamp: string }>;
  createdAt: string;
  updatedAt: string;
}

export function BuildStatus({ projectId }: BuildStatusProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["/api/status", projectId],
    refetchInterval: (data) => {
      // Stop polling if completed or failed
      return data?.status === "completed" || data?.status === "failed" ? false : 2000;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600";
      case "failed": return "text-red-600";
      case "processing": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "failed": return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "processing": return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getProgress = (status: string, logs: any[] = []) => {
    if (status === "completed") return 100;
    if (status === "failed") return 0;
    
    const stepProgress = {
      "start": 10,
      "scraping": 25,
      "scraping_complete": 40,
      "ai_generation": 60,
      "ai_complete": 80,
      "shopify_creation": 90,
      "shopify_complete": 100
    };

    const lastLog = logs[logs.length - 1];
    return lastLog ? stepProgress[lastLog.step] || 10 : 10;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Project not found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getStatusIcon(project.status)}
            <span>Build Status</span>
            <Badge variant={project.status === "completed" ? "default" : "secondary"}>
              {project.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{getProgress(project.status, project.logs)}%</span>
              </div>
              <Progress value={getProgress(project.status, project.logs)} />
            </div>
            
            {project.status === "completed" && project.shopifyUrl && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Store Ready!</h4>
                <p className="text-green-700 text-sm mb-3">
                  Your store has been successfully created and is ready for launch.
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Store URL:</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-white px-2 py-1 rounded border">
                        {project.shopifyUrl}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(project.shopifyUrl!, "Store URL")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(project.shopifyUrl!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {project.adminUrl && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Admin Panel:</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-white px-2 py-1 rounded border">
                          {project.adminUrl}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(project.adminUrl!, "Admin URL")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(project.adminUrl!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {project.status === "failed" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">Build Failed</h4>
                <p className="text-red-700 text-sm">
                  There was an error building your store. Please try again or contact support.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Build Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Build Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {project.logs?.map((log: any, index: number) => (
              <div key={index} className="flex items-start space-x-3 text-sm">
                <div className="flex-shrink-0 mt-0.5">
                  {log.step === "error" ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-gray-900">{log.message}</div>
                  <div className="text-gray-500 text-xs">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {(!project.logs || project.logs.length === 0) && (
              <div className="text-gray-500 text-sm">No logs available</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Store Preview */}
      {project.status === "completed" && project.shopifyUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Store Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="w-full h-96 rounded border bg-white flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Store Preview</p>
                  <Button onClick={() => window.open(project.shopifyUrl!, '_blank')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Live Store
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
