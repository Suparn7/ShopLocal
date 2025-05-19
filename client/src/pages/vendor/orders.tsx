import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import VendorLayout from "@/components/vendor/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Calendar } from "lucide-react";
import { Order, OrderItem, OrderStatus, Product, Shop } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { formatCurrency, getStatusBadgeClass } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Extended Order interface with items
interface OrderWithDetails extends Order {
  items: OrderItem[];
  products?: Record<number, Product>;
}

export default function VendorOrders() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  
  // Fetch vendor shops
  const { data: shops, isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ["/api/vendor/shops"],
    enabled: !!user,
  });
  
  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/vendor/orders"],
    enabled: !!user,
  });
  
  // Fetch products for all orders
  const { isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products-for-vendor-orders"],
    enabled: !!orders && orders.length > 0 && !!shops && shops.length > 0,
    queryFn: async () => {
      if (!orders || !shops) return {};
      
      const productsMap: Record<number, Product> = {};
      
      // Fetch products for each shop
      for (const shop of shops) {
        try {
          const response = await fetch(`/api/shops/${shop.id}/products`);
          const shopProducts: Product[] = await response.json();
          
          // Add products to map
          shopProducts.forEach(product => {
            productsMap[product.id] = product;
          });
        } catch (error) {
          console.error(`Failed to fetch products for shop ${shop.id}:`, error);
        }
      }
      
      // Update orders with product details
      const updatedOrders = orders.map(order => {
        const orderProducts: Record<number, Product> = {};
        order.items.forEach(item => {
          if (productsMap[item.productId]) {
            orderProducts[item.productId] = productsMap[item.productId];
          }
        });
        
        return {
          ...order,
          products: orderProducts
        };
      });
      
      return { productsMap, updatedOrders };
    },
  });
  
  const isLoading = shopsLoading || ordersLoading || productsLoading;
  
  // Filter orders based on selected tab
  const filteredOrders = orders?.filter(order => 
    selectedTab === "all" || order.status === selectedTab
  );
  
  // Group orders by date
  const groupOrdersByDate = (orders: OrderWithDetails[]) => {
    const grouped: Record<string, OrderWithDetails[]> = {};
    
    orders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(order);
    });
    
    return grouped;
  };
  
  const groupedOrders = filteredOrders ? groupOrdersByDate(filteredOrders) : {};
  
  // Update order status
  const updateOrderStatus = async (orderId: number, status: OrderStatus, customerId: number ) => {
    try {
      await apiRequest("PUT", `/api/orders/${orderId}/status`, { status, customerId });
      
      toast({
        title: t("vendor.statusUpdated"),
        description: t("vendor.orderStatusSuccess"),
      });
      
      // Close dialog and refresh orders
      setOrderDetailsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/orders"] });
    } catch (error) {
      toast({
        title: t("vendor.updateFailed"),
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };
  
  useEffect(() => {
    document.title = "Order Management - ShopLocal";
  }, []);

  return (
    <VendorLayout>
      <div className="max-w-5xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-4">{t("vendor.orderManagement")}</h2>
            
            <Tabs 
              defaultValue="all" 
              value={selectedTab} 
              onValueChange={(value) => setSelectedTab(value as OrderStatus | "all")}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="all">{t("vendor.allOrders")}</TabsTrigger>
                <TabsTrigger value={OrderStatus.PENDING}>{t("status.pending")}</TabsTrigger>
                <TabsTrigger value={OrderStatus.CONFIRMED}>{t("status.confirmed")}</TabsTrigger>
                <TabsTrigger value={OrderStatus.DISPATCHED}>{t("status.dispatched")}</TabsTrigger>
                <TabsTrigger value={OrderStatus.DELIVERED}>{t("status.delivered")}</TabsTrigger>
                <TabsTrigger value={OrderStatus.CANCELLED}>{t("status.cancelled")}</TabsTrigger>
              </TabsList>
              
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !filteredOrders || filteredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-neutral-400 mb-4">
                    <i className="fas fa-shopping-bag text-5xl opacity-30"></i>
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {selectedTab === "all" 
                      ? t("vendor.noOrders") 
                      : t("vendor.noOrdersStatus", { status: t(`status.${selectedTab}`) })}
                  </h3>
                  {selectedTab === "all" && (
                    <p className="text-sm text-muted-foreground">{t("vendor.waitingForOrders")}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedOrders).map(([date, dateOrders]) => (
                    <div key={date}>
                      <div className="flex items-center mb-3 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{date}</span>
                      </div>
                      
                      <div className="space-y-3">
                        {dateOrders.map(order => (
                          <div 
                            key={order.id}
                            className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                            onClick={() => {
                              setSelectedOrder(order);
                              setOrderDetailsOpen(true);
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">#{order.id}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleTimeString()}
                                </div>
                              </div>
                              
                              <Badge className={getStatusBadgeClass(order.status)}>
                                {t(`status.${order.status}`)}
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between items-end mt-3">
                              <div className="text-sm text-muted-foreground">
                                {order.items.length} {t("vendor.items")}
                              </div>
                              <div className="font-medium">
                                {formatCurrency(order.totalAmount)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Order Details Dialog */}
        <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("vendor.orderDetails")}</DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">{t("vendor.orderId")}</div>
                    <div className="font-medium">#{selectedOrder.id}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">{t("vendor.orderDate")}</div>
                    <div className="font-medium">
                      {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">{t("vendor.status")}</div>
                    <Badge className={getStatusBadgeClass(selectedOrder.status)}>
                      {t(`status.${selectedOrder.status}`)}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t("vendor.items")}</div>
                  
                  <div className="space-y-2 bg-neutral-50 p-3 rounded-md">
                    {selectedOrder.items.map(item => {
                      const product = selectedOrder.products?.[item.productId];
                      
                      return (
                        <div key={item.id} className="flex justify-between">
                          <div>
                            <div className="font-medium">{product?.name || `Product #${item.productId}`}</div>
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
                    
                    <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                      <span>{t("vendor.total")}</span>
                      <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t("vendor.customer")}</div>
                  <div className="font-medium">Customer #{selectedOrder.customerId}</div>
                  
                  {selectedOrder.deliveryAddress && (
                    <div className="text-sm mt-1">
                      <div className="text-muted-foreground">{t("vendor.deliveryAddress")}:</div>
                      <div>{selectedOrder.deliveryAddress}</div>
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t("vendor.payment")}</div>
                  <div className="font-medium">{selectedOrder.paymentMethod.toUpperCase()}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedOrder.paymentStatus ? t("vendor.paid") : t("vendor.pending")}
                  </div>
                </div>
                
                {/* Action buttons based on order status */}
                <div className="flex flex-col space-y-2 pt-2">
                  {selectedOrder.status === OrderStatus.PENDING && (
                    <>
                      <Button 
                        onClick={() => updateOrderStatus(selectedOrder.id, OrderStatus.CONFIRMED, selectedOrder.customerId)}
                        className="w-full"
                      >
                        {t("vendor.confirmOrder")}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => updateOrderStatus(selectedOrder.id, OrderStatus.CANCELLED, selectedOrder.customerId)}
                        className="w-full text-destructive"
                      >
                        {t("vendor.rejectOrder")}
                      </Button>
                    </>
                  )}
                  
                  {selectedOrder.status === OrderStatus.CONFIRMED && (
                    <Button 
                      onClick={() => updateOrderStatus(selectedOrder.id, OrderStatus.DISPATCHED, selectedOrder.customerId)}
                      className="w-full"
                    >
                      {t("vendor.dispatchOrder")}
                    </Button>
                  )}
                  
                  {selectedOrder.status === OrderStatus.DISPATCHED && (
                    <Button 
                      onClick={() => updateOrderStatus(selectedOrder.id, OrderStatus.DELIVERED, selectedOrder.customerId)}
                      className="w-full"
                    >
                      {t("vendor.markAsDelivered")}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </VendorLayout>
  );
}
