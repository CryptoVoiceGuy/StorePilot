import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { 
  ExternalLink, 
  DollarSign, 
  TrendingUp, 
  CheckCircle,
  Copy,
  Info,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReferralFlowProps {
  projectId: string;
  productData?: any;
  generatedContent?: any;
  status: string;
}

export function ReferralFlow({ projectId, productData, generatedContent, status }: ReferralFlowProps) {
  const [referralData, setReferralData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const createReferralMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/referral/create`, {
        method: "POST",
        body: JSON.stringify({ projectId }),
      });
    },
    onSuccess: (data) => {
      setReferralData(data);
      toast({
        title: "Referral Link Created!",
        description: "Your Shopify referral link is ready.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create referral link. Please try again.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = () => {
    if (referralData?.referralUrl) {
      navigator.clipboard.writeText(referralData.referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard.",
      });
    }
  };

  if (status !== "completed") {
    return null;
  }

  return (
    <Card className="mt-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Ready to Launch Your Store!
            </CardTitle>
            <CardDescription className="mt-1">
              Your product is ready. Now let's create your Shopify store and start earning.
            </CardDescription>
          </div>
          <Badge className="bg-green-100 text-green-700">Ready</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!referralData ? (
          <>
            {/* Benefits Section */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border">
                <DollarSign className="h-8 w-8 text-green-600 mb-2" />
                <h4 className="font-semibold">Earn 20% Commission</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Get recurring revenue from every store you create
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <CheckCircle className="h-8 w-8 text-blue-600 mb-2" />
                <h4 className="font-semibold">Fully Automated</h4>
                <p className="text-sm text-gray-600 mt-1">
                  We configure everything automatically after signup
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
                <h4 className="font-semibold">Scale Infinitely</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Create unlimited stores and multiply your income
                </p>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>How it works:</strong> Click the button below to get your special Shopify referral link. 
                When customers sign up through your link, you'll earn 20% of their Shopify subscription forever, 
                plus we'll automatically set up their store with your product!
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => createReferralMutation.mutate()}
              disabled={createReferralMutation.isPending}
              size="lg"
              className="w-full"
            >
              {createReferralMutation.isPending ? (
                "Creating Referral Link..."
              ) : (
                <>
                  Get Your Shopify Referral Link
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            {/* Referral Link Created */}
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Success!</strong> Your referral link is ready. Share it with customers to start earning!
              </AlertDescription>
            </Alert>

            {/* Referral Link */}
            <div className="bg-white p-4 rounded-lg border">
              <label className="text-sm font-medium text-gray-700">Your Referral Link:</label>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={referralData.referralUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={() => window.open(referralData.referralUrl, '_blank')}
                  size="sm"
                >
                  Open <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Store Name Suggestions */}
            {referralData.storeNameSuggestions && (
              <div className="bg-white p-4 rounded-lg border">
                <label className="text-sm font-medium text-gray-700">Suggested Store Names:</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {referralData.storeNameSuggestions.map((name: string, i: number) => (
                    <Badge key={i} variant="secondary">{name}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
              <ol className="space-y-2 text-sm text-blue-800">
                {Object.values(referralData.instructions).map((instruction: any, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-semibold">{i + 1}.</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Revenue Projection */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">💰 Revenue Potential:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Basic Plan ($39/mo):</span>
                  <p className="font-bold text-green-700">$7.80/month</p>
                </div>
                <div>
                  <span className="text-gray-600">Shopify Plan ($105/mo):</span>
                  <p className="font-bold text-green-700">$21/month</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                * You earn 20% recurring commission on all Shopify subscriptions
              </p>
            </div>

            {/* Reset Button */}
            <Button
              onClick={() => setReferralData(null)}
              variant="outline"
              className="w-full"
            >
              Create Another Referral Link
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}