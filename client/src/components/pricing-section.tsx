import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

export function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "$199",
      description: "per store",
      features: [
        "AI store generation",
        "Professional theme",
        "5 product pages",
        "Basic customization",
        "Email support"
      ],
      popular: false,
      ctaText: "Get Started",
      ctaVariant: "outline" as const
    },
    {
      name: "Professional",
      price: "$399", 
      description: "per store",
      features: [
        "Everything in Starter",
        "Unlimited product pages",
        "Advanced customization",
        "SEO optimization",
        "Priority support",
        "A/B testing tools"
      ],
      popular: true,
      ctaText: "Start Professional",
      ctaVariant: "default" as const
    },
    {
      name: "Enterprise",
      price: "$799",
      description: "per store", 
      features: [
        "Everything in Professional",
        "Custom branding",
        "Advanced analytics",
        "White-label solution",
        "24/7 phone support",
        "Dedicated account manager"
      ],
      popular: false,
      ctaText: "Contact Sales",
      ctaVariant: "outline" as const
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Pay once per store, no hidden fees. Get professional results at a fraction of traditional costs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`card-hover relative ${plan.popular ? 'border-2 border-primary shadow-xl scale-105' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-orange-500 hover:bg-orange-600">
                  Most Popular
                </Badge>
              )}
              
              <CardContent className={`p-8 text-center ${plan.popular ? 'bg-gradient-to-br from-primary/5 to-secondary/5' : ''}`}>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">{plan.price}</div>
                <div className="text-gray-600 mb-6">{plan.description}</div>
                
                <ul className="text-left space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="text-green-500 mr-3 h-4 w-4 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link href="/dashboard">
                  <Button 
                    variant={plan.ctaVariant}
                    className={`w-full ${plan.popular ? 'btn-primary' : ''}`}
                  >
                    {plan.ctaText}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">All plans include a 30-day money-back guarantee</p>
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <span>✓ No setup fees</span>
            <span>✓ Cancel anytime</span>
            <span>✓ 24/7 support</span>
          </div>
        </div>
      </div>
    </section>
  );
}
