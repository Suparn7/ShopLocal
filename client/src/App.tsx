import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";

// Customer Pages
import CustomerDashboard from "@/pages/customer/dashboard";
import ShopDetail from "@/pages/customer/shop-detail";
import CustomerOrders from "@/pages/customer/orders";
import CustomerProfile from "@/pages/customer/profile";
import CustomerSearch from "@/pages/customer/search";

// Vendor Pages
import VendorDashboard from "@/pages/vendor/dashboard";
import VendorInventory from "@/pages/vendor/inventory";
import VendorOrders from "@/pages/vendor/orders";
import VendorReviews from "@/pages/vendor/reviews";
import VendorSettings from "@/pages/vendor/settings";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminVendors from "@/pages/admin/vendors";
import AdminCustomers from "@/pages/admin/customers";
import AdminCategories from "@/pages/admin/categories";
import AdminAnalytics from "@/pages/admin/analytics";
import { Redirect } from "wouter";
import CustomerCart from "./pages/customer/cart";
import { CoordinatesProvider } from "@/context/CoordinatesContext";
import { CartProvider } from "./context/CartContext";


function Router() {
  return (
    <Switch>
      {/* Auth Route */}
      <Route path="/auth" component={AuthPage} />

      {/* Redirect from root to role-specific dashboard */}
      <ProtectedRoute path="/" component={() => {
        return (
          <Switch>
            <ProtectedRoute path="/" roles={[UserRole.CUSTOMER]} component={() => <Redirect to="/customer" />} />
            <ProtectedRoute path="/" roles={[UserRole.VENDOR]} component={() => <Redirect to="/vendor" />} />
            <ProtectedRoute path="/" roles={[UserRole.ADMIN]} component={() => <Redirect to="/admin" />} />
          </Switch>
        );
      }} />

      {/* Customer Routes */}
      <ProtectedRoute
        path="/customer"
        roles={[UserRole.CUSTOMER]}
        component={() => (
          <CartProvider>
            <CoordinatesProvider>
              <CustomerDashboard />
            </CoordinatesProvider>
          </CartProvider>
        )}
      />
      <ProtectedRoute
        path="/customer/shop/:id"
        roles={[UserRole.CUSTOMER]}
        component={() => (
          <CartProvider>
            <CoordinatesProvider>
              <ShopDetail />
            </CoordinatesProvider>
          </CartProvider>
        )}
      />
      <ProtectedRoute
        path="/customer/orders"
        roles={[UserRole.CUSTOMER]}
        component={() => (
          <CartProvider>
            <CoordinatesProvider>
              <CustomerOrders />
            </CoordinatesProvider>
          </CartProvider>
        )}
      />
      <ProtectedRoute
        path="/customer/profile"
        roles={[UserRole.CUSTOMER]}
        component={() => (
          <CartProvider>
            <CoordinatesProvider>
              <CustomerProfile />
            </CoordinatesProvider>
          </CartProvider>
        )}
      />
      <ProtectedRoute
        path="/customer/search"
        roles={[UserRole.CUSTOMER]}
        component={() => (
          <CartProvider>
            <CoordinatesProvider>
              <CustomerSearch />
            </CoordinatesProvider>
          </CartProvider>
        )}
      />

      {/* Vendor Routes */}
      <ProtectedRoute path="/vendor" roles={[UserRole.VENDOR]} component={VendorDashboard} />
      <ProtectedRoute path="/vendor/inventory" roles={[UserRole.VENDOR]} component={VendorInventory} />
      <ProtectedRoute path="/vendor/orders" roles={[UserRole.VENDOR]} component={VendorOrders} />
      <ProtectedRoute path="/vendor/reviews" roles={[UserRole.VENDOR]} component={VendorReviews} />
      <ProtectedRoute path="/vendor/settings" roles={[UserRole.VENDOR]} component={VendorSettings} />

      {/* Admin Routes */}
      <ProtectedRoute path="/admin" roles={[UserRole.ADMIN]} component={AdminDashboard} />
      <ProtectedRoute path="/admin/vendors" roles={[UserRole.ADMIN]} component={AdminVendors} />
      <ProtectedRoute path="/admin/customers" roles={[UserRole.ADMIN]} component={AdminCustomers} />
      <ProtectedRoute path="/admin/categories" roles={[UserRole.ADMIN]} component={AdminCategories} />
      <ProtectedRoute path="/admin/analytics" roles={[UserRole.ADMIN]} component={AdminAnalytics} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}



function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
