import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import CustomerLayout from "@/components/customer/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatCurrency, getStatusBadgeClass } from "@/lib/utils";
import { Order, OrderItem, Product, Shop, OrderStatus } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Import Dialog components
import { Textarea } from "@/components/ui/textarea";
import { useSocket } from "@/hooks/useSocket";

interface OrderWithDetails extends Order {
  items: OrderItem[];
  shop?: Shop;
  products?: Record<number, Product>;
}

export default function CustomerOrders() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [fetchedOrders, setFetchedOrders] = useState<OrderWithDetails[]>([]);
  // Inside the `CustomerOrders` component

  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/customer/orders"],
    enabled: !!user,
  });
  
  // Fetch shops
  const { data: shops, isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ["/api/shops"],
    enabled: !!orders && orders.length > 0,
  });

  // Synchronize fetchedOrders with orders
useEffect(() => {
  if (orders) {
    setFetchedOrders(orders);
  }
}, [orders]);
  
  // For each order, fetch products
  const { isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products-for-orders"],
    enabled: !!orders && orders.length > 0,
    queryFn: async () => {
      if (!orders) return {};
      
      // Collect all product IDs from order items
      const productIds = new Set<number>();
      orders.forEach(order => {
        order.items.forEach(item => {
          productIds.add(item.productId);
        });
      });
      
      // For each unique shop ID, fetch products
      const shopIds = new Set(orders.map(order => order.shopId));
      const productsMap: Record<number, Product> = {};
      
      for (const shopId of shopIds) {
        try {
          const response = await fetch(`/api/shops/${shopId}/products`);
          const shopProducts = await response.json();
          
          // Add products to map
          shopProducts.forEach((product: Product) => {
            productsMap[product.id] = product;
          });
        } catch (error) {
          console.error(`Failed to fetch products for shop ${shopId}:`, error);
        }
      }
      
      // Update orders with product and shop details
      const updatedOrders = orders.map(order => {
        const orderProducts: Record<number, Product> = {};
        order.items.forEach(item => {
          if (productsMap[item.productId]) {
            orderProducts[item.productId] = productsMap[item.productId];
          }
        });
        
        return {
          ...order,
          products: orderProducts,
          shop: shops?.find(shop => shop.id === order.shopId),
        };
      });
      
      return { productsMap, updatedOrders };
    },
  });
  
  const isLoading = ordersLoading || shopsLoading || productsLoading;
  
  const enrichedFetchedOrders = fetchedOrders?.map(order => ({
    ...order,
    shop: shops?.find(shop => shop.id === order.shopId),
  }));

  const handleSocketEvent = (event: string, data: any) => {
    if (event === "order-status-update") {
      console.log("Order status updated:", data);
  
      // Update the order status in the state
      setFetchedOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === data.orderId ? { ...order, status: data.status } : order
        )
      );
      // Show a toast notification
      toast({
        title: t("customer.orderUpdated"),
        description: t(`status.${data.status}`),
      });
    }
  };
  useEffect(() => {
    console.log("Fetched orders:", fetchedOrders);
    
  },[fetchedOrders]);
  
  // Use the WebSocket hook
  useSocket(user?.id, handleSocketEvent);
  
  useEffect(() => {
    document.title = `${t("common.orders")} - ShopLocal`;
  }, [t]);
  
  const cancelOrder = async (orderId: number) => {
    try {
      await apiRequest("PUT", `/api/orders/${orderId}/status`, { status: OrderStatus.CANCELLED });
      
      toast({
        title: t("customer.orderCancelled"),
        description: t("customer.orderCancelSuccess"),
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/customer/orders"] });
    } catch (error) {
      toast({
        title: t("customer.cancelFailed"),
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-4 pb-20">
        <h1 className="text-xl font-semibold mb-4">{t("common.orders")}</h1>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !enrichedFetchedOrders || enrichedFetchedOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-neutral-400 mb-4">
              <i className="fas fa-shopping-bag text-6xl opacity-30"></i>
            </div>
            <h3 className="text-lg font-medium mb-2">{t("customer.noOrders")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("customer.startShopping")}</p>
            <Button onClick={() => window.location.href = "/customer"}>
              {t("customer.browseShops")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {enrichedFetchedOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">
                        {order.shop?.name || t("customer.shop")}
                      </h3>
                      <div className="text-sm text-muted-foreground">
                        #{order.id} • {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <Badge className={getStatusBadgeClass(order.status)}>
                      {t(`status.${order.status}`)}
                    </Badge>
                  </div>
                  
                  <Accordion type="single" collapsible className="mt-3">
                    <AccordionItem value="items" className="border-0">
                      <AccordionTrigger className="py-2 text-sm">
                        {t("customer.viewOrderDetails")}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          {order.items.map((item) => {
                            const product = order.products?.[item.productId];
                            
                            return (
                              <div key={item.id} className="flex justify-between text-sm">
                                <div>
                                  <div>{product?.name || `Product #${item.productId}`}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatCurrency(item.price)} × {item.quantity}
                                  </div>
                                </div>
                                <div className="font-medium">
                                  {formatCurrency(item.price * item.quantity)}
                                </div>
                              </div>
                            );
                          })}
                          
                          <div className="pt-2 border-t flex justify-between font-medium">
                            <span>{t("customer.totalAmount")}</span>
                            <span>{formatCurrency(order.totalAmount)}</span>
                          </div>
                          
                          <div className="text-xs flex justify-between text-muted-foreground">
                            <span>{t("customer.paymentMethod")}: {order.paymentMethod.toUpperCase()}</span>
                            <span>
                              {order.paymentStatus ? t("customer.paid") : t("customer.pending")}
                            </span>
                          </div>
                          
                          {order.deliveryAddress && (
                            <div className="text-xs pt-2">
                              <div className="font-medium">{t("customer.deliveryAddress")}:</div>
                              <div className="text-muted-foreground">{order.deliveryAddress}</div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-sm font-medium">
                      {formatCurrency(order.totalAmount)}
                    </div>
                    
                    <div className="space-x-2">
                      {order.status === OrderStatus.PENDING && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => cancelOrder(order.id)}
                        >
                          {t("customer.cancelOrder")}
                        </Button>
                      )}
                      
                      {order.status === OrderStatus.DELIVERED && (
                        <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setReviewModalOpen(true);
                        }}
                      >
                        {t("customer.rateOrder")}
                      </Button>
                      )}
                    </div>
                    <Dialog open={isReviewModalOpen} onOpenChange={setReviewModalOpen}>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>{t("customer.writeReview")}</DialogTitle>
                        </DialogHeader>
                        {selectedOrder && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">{t("customer.rating")}</label>
                              <div className="flex space-x-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    className={`text-2xl ${star <= selectedOrder.rating ? "text-amber-400" : "text-neutral-300"}`}
                                    onClick={() => setSelectedOrder({ ...selectedOrder, rating: star })}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">{t("customer.comment")}</label>
                              <Textarea
                                value={selectedOrder.comment || ""}
                                onChange={(e) => setSelectedOrder({ ...selectedOrder, comment: e.target.value })}
                                placeholder={t("customer.writeComment")}
                              />
                            </div>
                            <Button
                              className="w-full"
                              onClick={async () => {
                                try {
                                  await apiRequest("POST", `/api/shops/${selectedOrder.shopId}/reviews`, {
                                    rating: selectedOrder.rating,
                                    comment: selectedOrder.comment,
                                    orderId: selectedOrder.id,
                                  });
                                  toast({
                                    title: t("customer.reviewSubmitted"),
                                    description: t("customer.thankYouForReview"),
                                  });
                                  setReviewModalOpen(false);
                                } catch (error) {
                                  toast({
                                    title: t("customer.reviewFailed"),
                                    description: (error as Error).message,
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              {t("customer.submitReview")}
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
