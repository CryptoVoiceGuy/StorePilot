import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Wand2, ExternalLink } from "lucide-react";

export function UrlInput() {
  const [url, setUrl] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const buildMutation = useMutation({
    mutationFn: async (data: { productUrl: string }) => {
      const response = await apiRequest("POST", "/api/build", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Store build started!",
        description: "Redirecting to build status...",
      });
      setLocation(`/dashboard?project=${data.projectId}`);
    },
    onError: (error) => {
      toast({
        title: "Build failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast({
        title: "URL required",
        description: "Please enter a product URL to get started.",
        variant: "destructive",
      });
      return;
    }

    try {
      new URL(url); // Validate URL format
      buildMutation.mutate({ productUrl: url });
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid product URL.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-xl border border-gray-200">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="url" className="text-sm font-medium text-gray-700 mb-2 block">
              Try it now - Paste any product URL:
            </Label>
            <div className="flex gap-3">
              <Input
                id="url"
                type="url"
                placeholder="https://amazon.com/product/example..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                disabled={buildMutation.isPending}
              />
              <Button 
                type="submit" 
                disabled={buildMutation.isPending}
                className="btn-primary"
              >
                {buildMutation.isPending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Wand2 className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 text-center">
            Supports Amazon, AliExpress, Shopify, and 500+ other platforms
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary" className="text-xs">
              <ExternalLink className="mr-1 h-3 w-3" />
              Amazon
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <ExternalLink className="mr-1 h-3 w-3" />
              AliExpress
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <ExternalLink className="mr-1 h-3 w-3" />
              Shopify
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <ExternalLink className="mr-1 h-3 w-3" />
              500+ more
            </Badge>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
