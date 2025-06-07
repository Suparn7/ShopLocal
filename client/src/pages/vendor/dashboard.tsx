import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import VendorLayout from "@/components/vendor/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Order, Shop } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { formatCurrency, getStatusBadgeClass } from "@/lib/utils";
import { StoreStatus } from "@/components/vendor/store-status";
import { OrderItem } from "@/components/vendor/order-item";
import { useSocket } from "@/hooks/useSocket";
import { queryClient } from "@/lib/queryClient";

// Additional interface to include items in order
interface OrderWithItems extends Order {
  items: any[];
}

export default function VendorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  console.log("VendorDashboard rendered");
  const handleSocketEvent = (event: string, data: any) => {
    if (event === "new-order") {
      console.log("New order received:", data);
  
      // Add the new order to the local state
      setOrders((prevOrders) => [data, ...prevOrders]);
  
      // Invalidate the query to refetch orders from the API
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/orders"] });
    }
  
    if (event === "order-status-update") {
      console.log("Order status updated:", data);
  
      // Update the order status in the local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === data.orderId ? { ...order, status: data.status } : order
        )
      );
  
      // Optionally refetch orders to ensure synchronization
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/orders"] });
    }
  };

  useSocket(user?.id, user?.role, handleSocketEvent);
  // Fetch vendor shops
  const { data: shops, isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ["/api/vendor/shops"],
    enabled: !!user,
  });
  
  // Fetch orders
  const { data: fetchedOrders, isLoading: ordersLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/vendor/orders"],
    enabled: !!user,
  });

  useEffect(() => {
    if (fetchedOrders) {
      setOrders((prevOrders) => {
        // Merge fetched orders with local orders
        const mergedOrders = [...fetchedOrders];
        prevOrders.forEach((localOrder) => {
          if (!fetchedOrders.some((order) => order.id === localOrder.id)) {
            mergedOrders.unshift(localOrder); // Add local orders to the top
          }
        });
        return mergedOrders;
      });
    }
  }, [fetchedOrders]);
  
  const isLoading = shopsLoading || ordersLoading || queryClient.isFetching({ queryKey: ["/api/vendor/orders"] });  
  // Calculate statistics
  const getTodayOrders = () => {
    if (!orders) return [];
    const today = new Date().toISOString().split('T')[0];
    return orders.filter(order => 
      new Date(order.createdAt).toISOString().split('T')[0] === today
    );
  };
  
  const getYesterdayOrders = () => {
    if (!orders) return [];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    return orders.filter(order => 
      new Date(order.createdAt).toISOString().split('T')[0] === yesterdayStr
    );
  };
  
  const getPendingOrders = () => {
    if (!orders) return [];
    return orders.filter(order => order.status === 'pending');
  };
  
  const todayOrders = getTodayOrders();
  const yesterdayOrders = getYesterdayOrders();
  const pendingOrders = getPendingOrders();
  
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  
  const revenueChange = yesterdayRevenue !== 0 
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
    : 100;
  
  const ordersChange = yesterdayOrders.length !== 0 
    ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100 
    : 100;
  
  useEffect(() => {
    document.title = "Vendor Dashboard - ShopLocal";
  }, []);

  return (
    <VendorLayout>
      <div className="max-w-5xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Store Status */}
            {shops && shops.length > 0 && (
              <StoreStatus shop={shops[0]} />
            )}
            
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <p className="text-neutral-400 text-sm">{t("vendor.todayOrders")}</p>
                  <p className="text-2xl font-bold">{todayOrders.length}</p>
                  <p className={`text-xs mt-1 ${ordersChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                    <i className={`fas fa-arrow-${ordersChange >= 0 ? 'up' : 'down'}`}></i> 
                    {' '}{Math.abs(ordersChange).toFixed(0)}% {t("vendor.fromYesterday")}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <p className="text-neutral-400 text-sm">{t("vendor.revenue")}</p>
                  <p className="text-2xl font-bold">{formatCurrency(todayRevenue)}</p>
                  <p className={`text-xs mt-1 ${revenueChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                    <i className={`fas fa-arrow-${revenueChange >= 0 ? 'up' : 'down'}`}></i> 
                    {' '}{Math.abs(revenueChange).toFixed(0)}% {t("vendor.fromYesterday")}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <p className="text-neutral-400 text-sm">{t("common.rating")}</p>
                  <p className="text-2xl font-bold">
                    {shops && shops.length > 0 ? '4.8' : '-'} 
                    <span className="text-xs text-success"><i className="fas fa-star"></i></span>
                  </p>
                  <p className="text-xs mt-1">
                    {t("vendor.basedOnReviews", { count: 120 })}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <p className="text-neutral-400 text-sm">{t("vendor.pendingOrders")}</p>
                  <p className="text-2xl font-bold">{pendingOrders.length}</p>
                  <p className="text-primary text-xs mt-1">
                    {pendingOrders.length > 0 ? t("vendor.requiresAction") : t("vendor.noAction")}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Orders */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">{t("vendor.recentOrders")}</h3>
                  <button onClick={() => window.location.href = "/vendor/orders"} className="text-primary text-sm">
                    {t("vendor.viewAll")}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  {!orders || orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t("vendor.noOrders")}
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-neutral-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("vendor.orderId")}</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("vendor.customer")}</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("vendor.amount")}</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("vendor.status")}</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-400">{t("vendor.date")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {orders
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort by date (latest first)
                          .slice(0, 5) // Show only the top 5 recent orders
                          .map(order => (
                            <tr key={order.id}>
                              <td className="px-3 py-2 text-sm">#{order.id}</td>
                              <td className="px-3 py-2 text-sm">Customer #{order.customerId}</td>
                              <td className="px-3 py-2 text-sm">{formatCurrency(order.totalAmount)}</td>
                              <td className="px-3 py-2 text-sm">
                                <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                                  {t(`status.${order.status}`)}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </VendorLayout>
  );
}
