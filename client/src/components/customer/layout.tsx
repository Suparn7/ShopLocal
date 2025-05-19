import { cloneElement, ReactNode, useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { BottomNav } from "@/components/customer/bottom-nav";
import { LocationBar } from "@/components/customer/location-bar";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useTranslation } from "react-i18next";
import { BellIcon, Minus, Plus, Search, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCoordinates } from "@/context/CoordinatesContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Product } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";


interface CustomerLayoutProps {
  children: ReactNode;
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { coordinates, setCoordinates } = useCoordinates();
  //console.log("coordinates in CustomerLayout:", coordinates);
  const [cartOpen, setCartOpen] = useState(false);
 // const [cartItems, setCartItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartAnimated, setIsCartAnimated] = useState(false);
  const { cartItems, addToCart, updateQuantity, removeFromCart, calculateTotal, shop, clearCart } = useCart();
  const { toast } = useToast();

  //  // Load cart items from localStorage on mount
  //  useEffect(() => {
  //   console.log("Loading cart items from localStorage");
    
  //   const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
  //   setCartItems(storedCart);
  // }, []);

   // Trigger animation when cart changes
  //  useEffect(() => {
  //   if (cartItems.length > 0) {
  //     setIsCartAnimated(true);
  //     const timeout = setTimeout(() => setIsCartAnimated(false), 500); // Reset animation after 500ms
  //     return () => clearTimeout(timeout);
  //   }
  // }, [cartItems]);

  //  // Update cart items whenever localStorage changes
  //  const syncCartWithLocalStorage = () => {
  //   const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
  //   setCartItems(storedCart);
  // };

  // const calculateTotal = () => {
  //   return cartItems.reduce((total, item) => total + item.product.sellingPrice * item.quantity, 0);
  // };

  // const updateQuantity = (productId: number, quantity: number) => {
  //   if (quantity <= 0) {
  //     removeFromCart(productId);
  //     return;
  //   }

  //   const updatedCart = cartItems.map((item) =>
  //     item.product.id === productId ? { ...item, quantity } : item
  //   );
  //   setCartItems(updatedCart);
  //   localStorage.setItem("cart", JSON.stringify(updatedCart));
  // };

  // const removeFromCart = (productId: number) => {
  //   const updatedCart = cartItems.filter((item) => item.product.id !== productId);
  //   setCartItems(updatedCart);
  //   localStorage.setItem("cart", JSON.stringify(updatedCart));
  // };

  const placeOrder = async () => {
    if (!shop || cartItems.length === 0) {
      toast({
        title: "Cart is empty or shop not selected",
        description: "Please add items to the cart before placing an order.",
        variant: "destructive",
      });
      return;
    }

    try {
      const total = calculateTotal();

      // Step 1: Create Razorpay Order
      const response = await apiRequest("POST", "/api/payments/create-order", {
        amount: total * 100, // Convert to paise
        currency: "INR",
      });

      const { id: orderId } = await response.json();

      // Step 2: Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: total * 100,
        currency: "INR",
        name: shop.name,
        description: "Order Payment",
        order_id: orderId,
        handler: async (response: any) => {
          // Step 3: Verify Payment
          const verifyResponse = await apiRequest("POST", "/api/payments/verify", {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (verifyResponse.ok) {
            // Step 4: Place Order
            const orderData = {
              shopId: shop.id,
              totalAmount: total,
              paymentMethod: "UPI",
              paymentStatus: true,
              status: "pending",
              items: cartItems.map((item) => ({
                productId: item.product.id,
                quantity: item.quantity,
                price: item.product.sellingPrice,
              })),
            };

            const res = await apiRequest("POST", "/api/orders", orderData);
            const newOrder = await res.json();

            toast({
              title: "Order Placed",
              description: "Your order has been placed successfully.",
            });

            // Clear cart and close modal
            clearCart();
            setCartOpen(false);

            // Invalidate orders query to refresh data
            queryClient.invalidateQueries({ queryKey: ["/api/customer/orders"] });
          } else {
            throw new Error("Payment verification failed.");
          }
        },
        prefill: {
          name: "Customer Name",
          email: "customer@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#3399cc",
        },
      };

      if (typeof window.Razorpay === "undefined") {
        toast({
          title: "Payment Initialization Failed",
          description: "Razorpay SDK not loaded. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast({
        title: "Order Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-bold text-primary">{t("common.shopLocal")}</span>
              <div className="ml-2">
                <LanguageToggle />
              </div>
            </div>
            <div className="flex items-center">
              <button className="p-2">
                <Search className="h-5 w-5 text-neutral-400" />
              </button>
              <button className="p-2 relative text-gray-500"
                onClick={() => setCartOpen(true)} // Open the modal

              >
                <ShoppingCart className="h-7 w-7 text-neutral-400" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItems.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </button>
              <button className="p-2 relative">
                <BellIcon className="h-5 w-5 text-neutral-400" />
                <span className="absolute top-1 right-1 bg-primary w-2 h-2 rounded-full"></span>
              </button>

            </div>
          </div>
          
          {/* Location Bar */}
          <LocationBar onLocationChange={setCoordinates} />
          </div>
      </header>

      {/* Main Content */}
      {children}

      {/* Cart Modal */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("customer.yourCart")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center">
                <p className="text-muted-foreground">{t("customer.cartEmpty")}</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.product.sellingPrice)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="icon"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                     <Minus className="h-5 w-5 text-neutral-400" />
                    </Button>
                    <span>{item.quantity}</span>
                    <Button
                      size="icon"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                     <Plus className="h-5 w-5 text-neutral-400" />
                     </Button>
                    <Button
                      variant="outline"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      {t("customer.remove")}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          {cartItems.length > 0 && (
            <div className="mt-4 flex justify-between items-center">
              <span className="text-lg font-semibold">
                {t("customer.totalAmount")}: {formatCurrency(calculateTotal())}
              </span>
              <Button onClick={placeOrder}>
                {t("customer.placeOrder")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <BottomNav currentPath={location} />
    </div>
  );
}
