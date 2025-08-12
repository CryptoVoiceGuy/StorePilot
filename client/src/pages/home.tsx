import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UrlInput } from "@/components/url-input";
import { PricingSection } from "@/components/pricing-section";
import { 
  Store, 
  Rocket, 
  Zap, 
  Palette, 
  Smartphone, 
  CreditCard, 
  TrendingUp,
  Star,
  CheckCircle,
  Play,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function Home() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const faqs = [
    {
      question: "How long does it take to build a store?",
      answer: "Most stores are completed in 5-15 minutes depending on the complexity of the product. Our AI works incredibly fast to extract data, generate content, and build your complete store."
    },
    {
      question: "Which platforms can I source products from?",
      answer: "We support Amazon, AliExpress, Shopify, manufacturer websites, and over 500 other e-commerce platforms. You can also upload product images and details manually if needed."
    },
    {
      question: "Do I own the store after it's built?",
      answer: "Yes! Once your store is built, you receive full ownership and admin access. The store is transferred to your Shopify account and you have complete control over it."
    },
    {
      question: "Can I customize the store after it's built?",
      answer: "Absolutely! Your store comes with full Shopify customization capabilities. You can modify colors, layouts, add new products, change copy, and make any adjustments you need."
    },
    {
      question: "What if I'm not satisfied with my store?",
      answer: "We offer a 30-day money-back guarantee. If you're not completely satisfied with your store, we'll provide a full refund. We also offer one free revision to ensure your store meets your expectations."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <nav className="container-max">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <Store className="text-white text-sm" />
              </div>
              <span className="text-xl font-bold text-gray-900">StoreForge AI</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">Dashboard</Link>
            </div>
            
            <Link href="/dashboard">
              <Button className="btn-primary">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 overflow-hidden">
        <div className="container-max section-padding">
          <div className="text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Rocket className="mr-2 h-4 w-4" />
              Launch your store in under 10 minutes
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Any Product URL<br/>
              Into a <span className="gradient-text">Live Shopify Store</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Paste a product link from Amazon, AliExpress, or any supplier. Our AI builds a complete, branded Shopify store with professional copy, optimized images, and conversion-focused design in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/dashboard">
                <Button size="lg" className="btn-primary text-lg px-8 py-4">
                  Build Your Store Now - Free
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            
            {/* Demo Input Section */}
            <div className="max-w-2xl mx-auto">
              <UrlInput />
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white">
        <div className="container-max">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">10min</div>
              <div className="text-gray-600">Average Build Time</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">15x</div>
              <div className="text-gray-600">Faster Than Manual</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">94%</div>
              <div className="text-gray-600">Customer Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">$2.3k</div>
              <div className="text-gray-600">Avg. Cost Savings</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section-padding bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="container-max">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              From Product URL to Live Store in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI handles the complex work of building a professional Shopify store so you can focus on growing your business.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                  1
                </div>
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary to-secondary"></div>
              </div>
              
              <Card className="card-hover">
                <CardContent className="p-8">
                  <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
                    <div className="text-xs text-gray-500 mb-2">Product URL Input</div>
                    <div className="font-mono text-sm text-primary break-all">
                      https://amazon.com/dp/B08N5WRWNW/wireless-earbuds-bluetooth
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Paste Your Product URL</h3>
                  <p className="text-gray-600">
                    Simply copy and paste any product link from Amazon, AliExpress, Shopify, or 500+ other platforms. Our AI instantly begins extracting product data.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                  2
                </div>
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary to-secondary"></div>
              </div>
              
              <Card className="card-hover">
                <CardContent className="p-8">
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <div className="text-sm text-center">
                      <div className="text-primary font-medium">AI Processing...</div>
                      <div className="text-gray-500 text-xs">Generating copy, optimizing images, building store</div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">AI Builds Your Store</h3>
                  <p className="text-gray-600">
                    Our advanced AI extracts product details, writes compelling copy, optimizes images, and constructs a complete branded Shopify store with all essential pages.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                3
              </div>
              
              <Card className="card-hover">
                <CardContent className="p-8">
                  <div className="bg-gray-900 rounded-lg p-4 mb-6 text-left">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="text-green-400 text-sm font-mono">
                      ✓ your-store.myshopify.com
                    </div>
                    <div className="text-gray-400 text-xs mt-1">Store is live and ready!</div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Get Your Live Store</h3>
                  <p className="text-gray-600">
                    Receive your live Shopify store URL and admin access. Your store is ready to start selling immediately with payment processing, shipping, and policies configured.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section-padding bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container-max">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Launch Successfully
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI doesn't just build a basic store - it creates a complete, professional e-commerce experience optimized for conversions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="text-white text-xl" />,
                title: "AI Content Generation",
                description: "Advanced AI writes compelling product descriptions, headlines, and marketing copy that converts visitors into customers.",
                gradient: "from-blue-500 to-purple-500"
              },
              {
                icon: <Palette className="text-white text-xl" />,
                title: "Image Optimization",
                description: "Automatically enhances product images, removes backgrounds, creates lifestyle shots, and optimizes for web performance.",
                gradient: "from-green-500 to-blue-500"
              },
              {
                icon: <Store className="text-white text-xl" />,
                title: "Brand Generation",
                description: "Creates cohesive brand identity with color schemes, logos, and design elements that match your product perfectly.",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: <Smartphone className="text-white text-xl" />,
                title: "Mobile-Optimized",
                description: "Every store is built mobile-first with responsive design that looks perfect on any device and loads lightning fast.",
                gradient: "from-orange-500 to-red-500"
              },
              {
                icon: <CreditCard className="text-white text-xl" />,
                title: "Payment Setup",
                description: "Pre-configured payment processing, shipping rates, and tax settings for major markets (US, EU, AU) so you can start selling immediately.",
                gradient: "from-indigo-500 to-purple-500"
              },
              {
                icon: <TrendingUp className="text-white text-xl" />,
                title: "SEO Optimized",
                description: "Built-in SEO optimization with meta tags, structured data, and performance optimization to rank higher in search results.",
                gradient: "from-teal-500 to-green-500"
              }
            ].map((feature, index) => (
              <Card key={index} className="card-hover">
                <CardContent className="p-8">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-lg flex items-center justify-center mb-6`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Join 5,000+ Successful Store Owners
            </h2>
            <p className="text-xl text-gray-600">
              See how our AI store builder has transformed businesses worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                rating: 5,
                text: "I went from product idea to live store in 8 minutes. The AI-generated copy was better than what I paid $500 for from a copywriter. Absolutely incredible!",
                name: "Mike Chen",
                title: "E-commerce Entrepreneur",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=150&h=150&fit=crop"
              },
              {
                rating: 5,
                text: "As a marketing agency, this tool has revolutionized how we launch client stores. We can now test 10x more products and our client success rate has skyrocketed.",
                name: "Sarah Johnson",
                title: "Marketing Director",
                avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&w=150&h=150&fit=crop"
              },
              {
                rating: 5,
                text: "The stores look so professional that customers think we're a major brand. Our conversion rate increased by 240% compared to our old store design.",
                name: "David Rodriguez",
                title: "Store Owner",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=150&h=150&fit=crop"
              }
            ].map((testimonial, index) => (
              <Card key={index} className={`card-hover ${index === 1 ? 'md:scale-105' : ''}`}>
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400 mr-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-gray-600 text-sm">5.0/5</span>
                  </div>
                  <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4 object-cover" 
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-gray-600 text-sm">{testimonial.title}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing">
        <PricingSection />
      </section>

      {/* FAQ */}
      <section className="section-padding bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about building your AI-powered store
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div 
                    className="flex justify-between items-start cursor-pointer" 
                    onClick={() => toggleFAQ(index)}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </h3>
                    {expandedFAQ === index ? (
                      <ChevronUp className="text-gray-400 mt-1 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="text-gray-400 mt-1 flex-shrink-0" />
                    )}
                  </div>
                  {expandedFAQ === index && (
                    <div className="mt-4 text-gray-600">
                      {faq.answer}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-br from-primary to-secondary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Launch Your Store in Minutes?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of successful entrepreneurs who've built their dream stores with AI. No technical skills required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                Start Building Your Store - Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
          
          <div className="mt-8 text-purple-100 text-sm">
            Free trial • No credit card required • 30-day guarantee
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white section-padding">
        <div className="container-max">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                  <Store className="text-white text-sm" />
                </div>
                <span className="text-xl font-bold">StoreForge AI</span>
              </div>
              <p className="text-gray-400 mb-4">
                Transform any product URL into a professional Shopify store in minutes with the power of AI.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Demo</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Press</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-12 bg-gray-800" />
          
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © 2024 StoreForge AI. All rights reserved.
            </div>
            <div className="flex space-x-6 text-gray-400 text-sm mt-4 sm:mt-0">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
              <a href="#" className="hover:text-white">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
