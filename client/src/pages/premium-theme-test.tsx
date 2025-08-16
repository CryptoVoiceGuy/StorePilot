import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface PremiumThemeInputs {
  product_url: string;
  product_title: string;
  product_category: string;
  raw_text: string;
  image_captions: string[];
  target_market: string;
  currency: string;
}

export default function PremiumThemeTest() {
  const [inputs, setInputs] = useState<PremiumThemeInputs>({
    product_url: "https://www.alibaba.com/product-detail/Handheld-Electric-Cleaning-Brush_1600854147865.html",
    product_title: "Handheld Electric Cleaning Brush",
    product_category: "Kitchen & Home",
    raw_text: "Professional handheld electric cleaning brush with powerful motor and durable bristles. Perfect for kitchen surfaces, bathroom tiles, and outdoor cleaning. Rechargeable battery lasts up to 2 hours. Waterproof design for wet cleaning.",
    image_captions: ["Electric cleaning brush in action", "Professional handheld design", "Multiple brush attachments"],
    target_market: "US",
    currency: "USD"
  });

  const [result, setResult] = useState<any>(null);

  const generateThemeMutation = useMutation({
    mutationFn: async (data: PremiumThemeInputs) => {
      const response = await fetch("/api/premium-theme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error) => {
      console.error("Theme generation failed:", error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateThemeMutation.mutate(inputs);
  };

  const handleInputChange = (field: keyof PremiumThemeInputs, value: string | string[]) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addImageCaption = () => {
    setInputs(prev => ({
      ...prev,
      image_captions: [...prev.image_captions, ""]
    }));
  };

  const updateImageCaption = (index: number, value: string) => {
    setInputs(prev => ({
      ...prev,
      image_captions: prev.image_captions.map((caption, i) => i === index ? value : caption)
    }));
  };

  const removeImageCaption = (index: number) => {
    setInputs(prev => ({
      ...prev,
      image_captions: prev.image_captions.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Premium Theme Generator Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Product Inputs</CardTitle>
              <CardDescription>
                Enter product details to generate a premium Shopify theme design
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="product_url">Product URL</Label>
                  <Input
                    id="product_url"
                    value={inputs.product_url}
                    onChange={(e) => handleInputChange("product_url", e.target.value)}
                    placeholder="https://example.com/product"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="product_title">Product Title</Label>
                  <Input
                    id="product_title"
                    value={inputs.product_title}
                    onChange={(e) => handleInputChange("product_title", e.target.value)}
                    placeholder="Enter product title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="product_category">Product Category</Label>
                  <Select
                    value={inputs.product_category}
                    onValueChange={(value) => handleInputChange("product_category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kitchen & Home">Kitchen & Home</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Sports & Fitness">Sports & Fitness</SelectItem>
                      <SelectItem value="Beauty & Health">Beauty & Health</SelectItem>
                      <SelectItem value="Fashion">Fashion</SelectItem>
                      <SelectItem value="Automotive">Automotive</SelectItem>
                      <SelectItem value="Garden & Outdoor">Garden & Outdoor</SelectItem>
                      <SelectItem value="Toys & Games">Toys & Games</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="raw_text">Raw Text Description</Label>
                  <Textarea
                    id="raw_text"
                    value={inputs.raw_text}
                    onChange={(e) => handleInputChange("raw_text", e.target.value)}
                    placeholder="Enter detailed product description..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label>Image Captions</Label>
                  {inputs.image_captions.map((caption, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={caption}
                        onChange={(e) => updateImageCaption(index, e.target.value)}
                        placeholder={`Image caption ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeImageCaption(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addImageCaption}
                  >
                    Add Caption
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target_market">Target Market</Label>
                    <Select
                      value={inputs.target_market}
                      onValueChange={(value) => handleInputChange("target_market", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={inputs.currency}
                      onValueChange={(value) => handleInputChange("currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={generateThemeMutation.isPending}
                >
                  {generateThemeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Theme...
                    </>
                  ) : (
                    "Generate Premium Theme"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Theme Design Result</CardTitle>
              <CardDescription>
                Premium theme design generated for your product
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generateThemeMutation.isPending && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Generating premium theme design...</span>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800">
                      {result.blocked ? "❌ Blocked" : "✅ Generated Successfully"}
                    </h3>
                    {result.blocked && (
                      <p className="text-green-700 text-sm">{result.blocked_reason}</p>
                    )}
                  </div>

                  {!result.blocked && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold">Style</h4>
                          <p className="text-sm">Primary: {result.style.primary}</p>
                          <p className="text-sm">Secondary: {result.style.secondary}</p>
                          <p className="text-sm">Confidence: {Math.round(result.style.confidence * 100)}%</p>
                        </div>
                        <div>
                          <h4 className="font-semibold">Theme</h4>
                          <p className="text-sm">{result.theme}</p>
                          <p className="text-sm text-gray-600">{result.tone}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold">Color Palette</h4>
                        <div className="flex gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: result.palette.primary }}
                            />
                            <span className="text-xs">{result.palette.primary}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: result.palette.accent_1 }}
                            />
                            <span className="text-xs">{result.palette.accent_1}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: result.palette.accent_2 }}
                            />
                            <span className="text-xs">{result.palette.accent_2}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold">Hero Copy</h4>
                        <p className="text-lg font-bold">{result.copy.hero.headline}</p>
                        <p className="text-sm text-gray-600">{result.copy.hero.subhead}</p>
                        <Button size="sm" className="mt-2">{result.copy.hero.cta}</Button>
                      </div>

                      <div>
                        <h4 className="font-semibold">Key Benefits</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {result.copy.bullets.map((bullet: string, index: number) => (
                            <li key={index}>{bullet}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="max-h-60 overflow-y-auto">
                        <h4 className="font-semibold">Raw JSON Output</h4>
                        <pre className="text-xs bg-gray-100 p-3 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              )}

              {generateThemeMutation.isError && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800">Generation Failed</h3>
                  <p className="text-red-700 text-sm">
                    {generateThemeMutation.error?.message || "Unknown error occurred"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}