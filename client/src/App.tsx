import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import StorePreview from "@/pages/store-preview";
import ConnectShopify from "@/pages/connect-shopify";
import ShopifyStatus from "@/pages/shopify-status";
import ShopifySetupGuide from "@/pages/shopify-setup-guide";
import GenerateTokenGuide from "@/pages/generate-token-guide";
import PartnerAPIClientGuide from "@/pages/partner-api-client-guide";
import PremiumThemeTest from "@/pages/premium-theme-test";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/store/:id" component={StorePreview} />
      <Route path="/connect-shopify" component={ConnectShopify} />
      <Route path="/shopify-status" component={ShopifyStatus} />
      <Route path="/shopify-setup-guide" component={ShopifySetupGuide} />
      <Route path="/generate-token" component={GenerateTokenGuide} />
      <Route path="/partner-api-client" component={PartnerAPIClientGuide} />
      <Route path="/premium-theme-test" component={PremiumThemeTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
