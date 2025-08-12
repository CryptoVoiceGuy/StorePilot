import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ShoppingCart, Check } from "lucide-react";

interface StoreMockupProps {
  productData?: any;
  generatedContent?: any;
}

export function StoreMockup({ productData, generatedContent }: StoreMockupProps) {
  const mockProduct = {
    title: generatedContent?.productTitle || productData?.title || "Premium Wireless Earbuds with ANC",
    price: productData?.price || "$79.99",
    originalPrice: "$129.99",
    images: productData?.images?.[0] || "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
    brand: generatedContent?.brandName || productData?.brand || "AudioWave Pro",
    features: generatedContent?.features || productData?.features?.slice(0, 3) || [
      "Active Noise Cancellation",
      "30-Hour Battery Life", 
      "Waterproof IPX7 Rating"
    ],
    rating: 4.8,
    reviews: 1247
  };

  return (
    <Card className="overflow-hidden shadow-2xl">
      {/* Browser Header */}
      <div className="bg-gray-200 px-4 py-3 flex items-center space-x-2">
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <div className="flex-1 bg-white rounded ml-4 px-3 py-1 text-sm text-gray-600">
          https://{mockProduct.brand.toLowerCase().replace(/\s+/g, '-')}.myshopify.com
        </div>
      </div>
      
      {/* Store Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <ShoppingCart className="text-white h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-gray-900">{mockProduct.brand}</span>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <span className="text-gray-600">Shop</span>
            <span className="text-gray-600">About</span>
            <span className="text-gray-600">Contact</span>
            <ShoppingCart className="text-gray-600 h-5 w-5" />
          </div>
        </div>
      </div>
      
      {/* Product Section */}
      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div>
            <img 
              src={mockProduct.images}
              alt={mockProduct.title}
              className="rounded-xl shadow-lg w-full h-80 object-cover" 
            />
          </div>
          
          {/* Product Details */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {mockProduct.title}
            </h1>
            
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl font-bold text-primary">{mockProduct.price}</span>
              <span className="text-lg text-gray-500 line-through">{mockProduct.originalPrice}</span>
              <Badge className="bg-red-100 text-red-800 hover:bg-red-200">38% OFF</Badge>
            </div>
            
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <span className="ml-2 text-gray-600">({mockProduct.reviews.toLocaleString()} reviews)</span>
            </div>
            
            <div className="space-y-2 mb-6">
              {mockProduct.features.map((feature: string, index: number) => (
                <div key={index} className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
            
            <Button className="w-full btn-primary text-lg py-3">
              Add to Cart - {mockProduct.price}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
