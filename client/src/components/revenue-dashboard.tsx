import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  ShoppingCart,
  Calendar,
  ArrowUpRight,
  Target,
  Award
} from "lucide-react";

export function RevenueDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/referral/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const revenueCards = [
    {
      title: "Monthly Recurring",
      value: stats.estimatedMonthlyRevenueFormatted || "$0.00",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "From active stores"
    },
    {
      title: "Annual Projection",
      value: stats.projectedAnnualRevenueFormatted || "$0.00",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Based on current stores"
    },
    {
      title: "Converted Stores",
      value: stats.convertedReferrals || "0",
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "Successfully launched"
    },
    {
      title: "Pending Referrals",
      value: stats.pendingReferrals || "0",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "In progress"
    }
  ];

  const potentialEarnings = [
    { stores: 10, monthly: "$78", annual: "$936" },
    { stores: 25, monthly: "$195", annual: "$2,340" },
    { stores: 50, monthly: "$390", annual: "$4,680" },
    { stores: 100, monthly: "$780", annual: "$9,360" },
  ];

  return (
    <div className="space-y-6">
      {/* Revenue Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        {revenueCards.map((card, i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.description}</p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Potential Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Revenue Potential Calculator
          </CardTitle>
          <CardDescription>
            Earnings based on Basic Shopify plan ($39/month × 20% commission)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Number of Stores</th>
                  <th className="text-right py-2 px-4">Monthly Revenue</th>
                  <th className="text-right py-2 px-4">Annual Revenue</th>
                </tr>
              </thead>
              <tbody>
                {potentialEarnings.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{row.stores} stores</Badge>
                    </td>
                    <td className="text-right py-3 px-4 font-semibold">{row.monthly}</td>
                    <td className="text-right py-3 px-4 font-bold text-green-600">{row.annual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-900">Higher Tier Bonuses</h4>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Shopify Plan ($105/mo):</span>
                <p className="font-bold text-green-700">$21/month per store</p>
              </div>
              <div>
                <span className="text-gray-600">Advanced Plan ($399/mo):</span>
                <p className="font-bold text-green-700">$79.80/month per store</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Tips */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-primary" />
            Tips to Maximize Your Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">1</div>
              <div>
                <h4 className="font-semibold">Target High-Value Products</h4>
                <p className="text-sm text-gray-600">Focus on products with higher margins that attract serious entrepreneurs</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">2</div>
              <div>
                <h4 className="font-semibold">Share Success Stories</h4>
                <p className="text-sm text-gray-600">Show real examples of profitable stores you've created</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">3</div>
              <div>
                <h4 className="font-semibold">Offer Premium Support</h4>
                <p className="text-sm text-gray-600">Help customers upgrade to higher Shopify plans for bigger commissions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}