import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import CustomerLayout from "@/components/customer/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shop, 
  Product,
  Review,
  OrderStatus,
  PaymentMethod,
  User,
  insertOrderSchema
} from "@shared/schema";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useCart } from "@/context/CartContext";

// console.log("PUSHHHHHHHH", process.env.VITE_STRIPE_PUBLISHABLE_KEY);
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

export default function ShopDetail() {
  // Step 2: Initialize Stripe Elements
  // const stripe = useStripe();
  // const elements = useElements();
  const { id } = useParams();
  const shopId = parseInt(id || "0");
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedProducts, setSelectedProducts] = useState<{product: Product, quantity: number}[]>([]);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.UPI);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { addToCart, setShop } = useCart();

  // console.log("Stripe publishable key:", import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  // const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");
  // console.log("Stripe promise:", stripePromise);

  // Fetch shop details
  const { data: shop, isLoading: shopLoading } = useQuery<Shop>({
    queryKey: [`/api/shops/${shopId}`],
    enabled: !!shopId,
  });
  
  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [`/api/shops/${shopId}/products`],
    enabled: !!shopId,
  });
  
  // Fetch reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: [`/api/shops/${shopId}/reviews`],
    enabled: !!shopId,
  });
  
  // Fetch reviewer names
  const { data: reviewers } = useQuery<User[]>({
    queryKey: ["/api/admin/customers"],
    enabled: !!reviews && reviews.length > 0,
  });
  
  const isLoading = shopLoading || productsLoading || reviewsLoading;
  
  useEffect(() => {
    if (shop) {
      setShop(shop); // Set the shop in the CartContext
    }
  }, [shop]);
  
  useEffect(() => {
    if (shop) {
      document.title = `${shop.name} - ShopLocal`;
    } else {
      document.title = "Shop Details - ShopLocal";
    }
  }, [shop]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  // const addToCart = (product: Product) => {
  //   const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
  //   const existingItem = existingCart.find((item: any) => item.product.id === product.id);
  
  //   let updatedCart;
  //   if (existingItem) {
  //     updatedCart = existingCart.map((item: any) =>
  //       item.product.id === product.id
  //         ? { ...item, quantity: item.quantity + 1 }
  //         : item
  //     );
  //   } else {
  //     updatedCart = [...existingCart, { product, quantity: 1 }];
  //   }
  
  //   localStorage.setItem("cart", JSON.stringify(updatedCart));
  
  //   toast({
  //     title: t("customer.productAdded"),
  //     description: product.name,
  //   });
  // };
  

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };
  const removeFromCart = (productId: number) => {
    setSelectedProducts(prev => prev.filter(item => item.product.id !== productId));
  };
  
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setSelectedProducts(prev => 
      prev.map(item => 
        item.product.id === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };
  
  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => total + (item.product.sellingPrice * item.quantity), 0);
  };
  
  // Replace the `placeOrder` function
  const placeOrder = async () => {
    if (!shop || !user || selectedProducts.length === 0) return;

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
              customerId: user.id,
              shopId: shop.id,
              totalAmount: total,
              paymentMethod,
              paymentStatus: true,
              status: OrderStatus.PENDING,
              items: selectedProducts.map((item) => ({
                productId: item.product.id,
                quantity: item.quantity,
                price: item.product.sellingPrice,
              })),
            };

            const res = await apiRequest("POST", "/api/orders", orderData);
            const newOrder = await res.json();

            toast({
              title: t("customer.orderPlaced"),
              description: t("customer.orderSuccessMessage"),
            });

            // Clear cart and close dialog
            setSelectedProducts([]);
            setOrderDialogOpen(false);

            // Invalidate orders query to refresh data
            queryClient.invalidateQueries({ queryKey: ["/api/customer/orders"] });
          } else {
            throw new Error("Payment verification failed.");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || "8377818027", // Use a default value if user.phone is null
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
        title: t("customer.orderFailed"),
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };
  
  const getReviewerName = (reviewerId: number): string => {
    if (!reviewers) return "Customer";
    const reviewer = reviewers.find(r => r.id === reviewerId);
    return reviewer?.name || "Customer";
  };
  
  const calculateAverageRating = (): number => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return sum / reviews.length;
  };
  
  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CustomerLayout>
    );
  }
  
  if (!shop) {
    return (
      <CustomerLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Shop not found</h2>
          <p className="text-muted-foreground">The shop you're looking for doesn't exist or has been removed.</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="pb-20">
        {/* Shop Header */}
        <div className="relative">
          <div className="h-40 bg-primary/10 flex items-center justify-center">
            {shop.image ? (
              <img src={shop.image} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <i className="fas fa-store text-5xl text-primary/30"></i>
            )}
          </div>
          
          {shop.deliveryAvailable && (
            <div className="absolute bottom-2 left-4">
              <Badge variant="default" className="bg-primary text-white">
                {t("customer.freeDelivery")}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="container mx-auto px-4">
          <div className="bg-white mt-4 rounded-t-xl shadow-sm p-4 relative">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-semibold">{shop.name}</h1>
                <p className="text-sm text-muted-foreground">{shop.description}</p>
                <div className="flex items-center mt-1 text-sm">
                  <i className="fas fa-map-marker-alt text-primary mr-1"></i>
                  <span>{shop.address}, {shop.city}</span>
                </div>
              </div>
              
              <div className="flex items-center bg-success bg-opacity-10 px-2 py-1 rounded">
                <span className="text-success font-medium mr-1">{calculateAverageRating().toFixed(1)}</span>
                <i className="fas fa-star text-success text-xs"></i>
              </div>
            </div>
            
            <div className="flex items-center mt-3 text-sm">
              <span className="mr-4">
                <i className="fas fa-clock text-muted-foreground mr-1"></i>
                {shop.openTime && shop.closeTime ? 
                  `${t("customer.openUntil")} ${shop.closeTime}` : 
                  t("customer.open24Hours")}
              </span>
              
              {shop.avgDeliveryTime && (
                <span>
                  <i className="fas fa-shipping-fast text-muted-foreground mr-1"></i>
                  {t("customer.deliveryTime")} {shop.avgDeliveryTime} {t("customer.minutes")}
                </span>
              )}
            </div>
            
            {shop.isGstVerified && (
              <div className="mt-2 text-xs">
                <i className="fas fa-check-circle text-success mr-1"></i>
                {t("customer.gstCompliant")}
              </div>
            )}
          </div>
        </div>
        
        {/* Shop Content */}
        <div className="container mx-auto px-4 py-4">
          <Tabs defaultValue="products">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="products">{t("customer.products")}</TabsTrigger>
              <TabsTrigger value="reviews">{t("common.reviews")}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products" className="space-y-4">
              {!products || products.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center">
                  <div className="text-neutral-400 mb-2">
                    <i className="fas fa-box text-4xl opacity-30"></i>
                  </div>
                  <h3 className="text-lg font-medium mb-1">{t("customer.noProducts")}</h3>
                  <p className="text-sm text-muted-foreground">{t("customer.checkBackLater")}</p>
                </div>
              ) : (
                <>
                  {/* Product List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map(product => (
                      <Card key={product.id} className={!product.isAvailable ? "opacity-60" : ""}>
                        <CardContent className="p-4">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-sm text-muted-foreground">{product.description}</p>
                              
                              <div className="mt-2">
                                <span className="text-sm font-bold">{formatCurrency(product.sellingPrice)}</span>
                                {product.mrp > product.sellingPrice && (
                                  <span className="text-xs text-muted-foreground line-through ml-2">
                                    {formatCurrency(product.mrp)}
                                  </span>
                                )}
                              </div>
                              
                              {product.unit && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {product.unit}
                                </div>
                              )}
                            </div>
                            
                            {product.image ? (
                              <div className="w-20 h-20 rounded-md overflow-hidden bg-neutral-100">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-20 h-20 rounded-md bg-neutral-100 flex items-center justify-center">
                                <i className="fas fa-box text-neutral-300"></i>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 flex justify-between items-center">
                            {!product.isAvailable ? (
                              <Badge variant="outline" className="text-muted-foreground">
                                {t("customer.outOfStock")}
                              </Badge>
                            ) : product.stock <= 5 ? (
                              <span className="text-xs text-amber-600">
                                {t("customer.onlyLeft", { count: product.stock })}
                              </span>
                            ) : (
                              <span className="text-xs text-success">
                                {t("customer.inStock")}
                              </span>
                            )}
                            
                            <Button 
                              size="sm" 
                              disabled={!product.isAvailable || product.stock <= 0}
                              onClick={() => handleAddToCart(product)}
                            >
                              {t("customer.addToCart")}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Cart Floating Button */}
                  {selectedProducts.length > 0 && (
                    <div className="fixed bottom-20 left-0 right-0 px-4 z-20">
                      {clientSecret ? (
                          <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
                            <DialogTrigger asChild>
                              <Button className="w-full py-6" size="lg">
                                <i className="fas fa-shopping-bag mr-2"></i>
                                {selectedProducts.length} {t("customer.itemsInCart")} • {formatCurrency(calculateTotal())}
                              </Button>
                            </DialogTrigger>

                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>{t("customer.yourOrder")}</DialogTitle>
                              </DialogHeader>

                              <div className="space-y-4 my-4">
                                <div className="text-sm font-medium">{shop.name}</div>

                                {selectedProducts.map(item => (
                                  <div key={item.product.id} className="flex justify-between items-center">
                                    <div className="flex-1">
                                      <div className="font-medium">{item.product.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {formatCurrency(item.product.sellingPrice)} × {item.quantity}
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                <Separator />

                                <div className="flex justify-between font-medium">
                                  <span>{t("customer.totalAmount")}</span>
                                  <span>{formatCurrency(calculateTotal())}</span>
                                </div>

                                {/* Render PaymentElement only when clientSecret is available */}
                                {/* <PaymentElement /> */}
                              </div>

                              <Button className="w-full" onClick={placeOrder}>
                                {t("customer.placeOrder")}
                              </Button>
                            </DialogContent>
                          </Dialog>
                      ) : (
                        <Button
                          className="w-full py-6"
                          size="lg"
                          onClick={async () => {
                            try {
                              const total = calculateTotal();

                              // Fetch clientSecret from backend
                              const response = await apiRequest("POST", "/api/payments/create-intent", {
                                amount: total,
                                currency: "inr",
                              });

                              const { clientSecret } = await response.json();
                              setClientSecret(clientSecret); // Set the clientSecret here

                              if (!clientSecret) {
                                throw new Error("Failed to retrieve client secret.");
                              }

                              setOrderDialogOpen(true); // Open the dialog after fetching the clientSecret
                            } catch (error) {
                              toast({
                                title: "Payment Initialization Failed",
                                description: (error as Error).message,
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <i className="fas fa-shopping-bag mr-2"></i>
                          {selectedProducts.length} {t("customer.itemsInCart")} • {formatCurrency(calculateTotal())}
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="reviews">
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold">{calculateAverageRating().toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">
                      {reviews ? reviews.length : 0} {t("common.reviews")}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map(rating => {
                      const count = reviews ? reviews.filter(r => r.rating === rating).length : 0;
                      const percentage = reviews && reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      
                      return (
                        <div key={rating} className="flex items-center text-sm mb-1">
                          <span className="w-3">{rating}</span>
                          <i className="fas fa-star text-accent mx-1 text-xs"></i>
                          <div className="flex-1 mx-2 bg-neutral-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-accent h-full rounded-full" 
                              style={{width: `${percentage}%`}}
                            ></div>
                          </div>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {!reviews || reviews.length === 0 ? (
                  <div className="bg-white rounded-lg p-8 text-center">
                    <div className="text-neutral-400 mb-2">
                      <i className="fas fa-star text-4xl opacity-30"></i>
                    </div>
                    <h3 className="text-lg font-medium mb-1">{t("customer.noReviews")}</h3>
                    <p className="text-sm text-muted-foreground">{t("customer.beFirstToReview")}</p>
                  </div>
                ) : (
                  reviews.map(review => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between">
                          <div className="font-medium">{getReviewerName(review.customerId)}</div>
                          <div className="flex items-center bg-success bg-opacity-10 px-2 py-1 rounded">
                            <span className="text-success font-medium mr-1">{review.rating}</span>
                            <i className="fas fa-star text-success text-xs"></i>
                          </div>
                        </div>
                        
                        {review.comment && (
                          <p className="mt-2 text-sm">{review.comment}</p>
                        )}
                        
                        <div className="mt-2 text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </CustomerLayout>
  );
}
