import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Order, OrderStatus } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { formatCurrency, getStatusBadgeClass } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OrderItemProps {
  order: Order;
}

export function OrderItem({ order }: OrderItemProps) {
  
  const { t } = useTranslation();
  const { toast } = useToast();
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Update order status
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status, customerId }: { orderId: number; status: OrderStatus; customerId: number }) => {
      await apiRequest("PUT", `/api/orders/${orderId}/status`, { status, customerId });
    },
    onSuccess: () => {
      toast({
        title: t("vendor.statusUpdated"),
        description: t("vendor.orderStatusSuccess"),
      });
      setDetailsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("vendor.updateFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Get button label based on current status
  const getActionLabel = () => {
    switch (order.status) {
      case OrderStatus.PENDING:
        return t("vendor.process");
      case OrderStatus.CONFIRMED:
        return t("vendor.dispatch");
      case OrderStatus.DISPATCHED:
        return t("vendor.track");
      default:
        return t("vendor.details");
    }
  };
  
  // Handle status update
  const handleUpdateStatus = () => {
    switch (order.status) {
      case OrderStatus.PENDING:
        updateOrderStatus.mutate({ orderId: order.id, status: OrderStatus.CONFIRMED, customerId: order.customerId });
        break;
      case OrderStatus.CONFIRMED:
        updateOrderStatus.mutate({ orderId: order.id, status: OrderStatus.DISPATCHED, customerId: order.customerId });
        break;
      case OrderStatus.DISPATCHED:
        updateOrderStatus.mutate({ orderId: order.id, status: OrderStatus.DELIVERED, customerId: order.customerId });
        break;
      default:
        setDetailsOpen(false);
    }
  };
  
  return (
    <>
      <tr className="hover:bg-neutral-50">
        <td className="px-3 py-3 text-sm">#{order.id}</td>
        <td className="px-3 py-3 text-sm">Customer #{order.customerId}</td>
        <td className="px-3 py-3 text-sm">{formatCurrency(order.totalAmount)}</td>
        <td className="px-3 py-3 text-sm">
          <Badge className={getStatusBadgeClass(order.status)}>
            {t(`status.${order.status}`)}
          </Badge>
        </td>
        <td className="px-3 py-3 text-sm">
          <Button 
            variant="ghost" 
            className="text-primary hover:text-primary hover:underline"
            onClick={() => setDetailsOpen(true)}
          >
            {getActionLabel()}
          </Button>
        </td>
      </tr>
      
      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("vendor.orderDetails")}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{t("vendor.orderId")}</div>
                <div className="font-medium">#{order.id}</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">{t("vendor.orderDate")}</div>
                <div className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">{t("vendor.status")}</div>
                <Badge className={getStatusBadgeClass(order.status)}>
                  {t(`status.${order.status}`)}
                </Badge>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground mb-1">{t("vendor.customer")}</div>
              <div className="font-medium">Customer #{order.customerId}</div>
              
              {order.deliveryAddress && (
                <div className="text-sm mt-1">
                  <div className="text-muted-foreground">{t("vendor.deliveryAddress")}:</div>
                  <div>{order.deliveryAddress}</div>
                </div>
              )}
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground mb-1">{t("vendor.payment")}</div>
                <div className="font-medium">{order.paymentMethod?.toUpperCase() || "N/A"}</div>              <div className="text-sm text-muted-foreground">
                {order.paymentStatus ? t("vendor.paid") : t("vendor.pending")}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground mb-1">{t("vendor.items")}</div>
              {/* In a real app, we would display the order items here */}
              <div className="text-sm font-medium">{t("vendor.total")}: {formatCurrency(order.totalAmount)}</div>
            </div>
            
            {/* Action buttons based on order status */}
            <div className="flex justify-end space-x-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setDetailsOpen(false)}
              >
                {t("common.close")}
              </Button>
              
              {order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED && (
                <Button onClick={handleUpdateStatus}>
                  {order.status === OrderStatus.PENDING && t("vendor.confirmOrder")}
                  {order.status === OrderStatus.CONFIRMED && t("vendor.dispatchOrder")}
                  {order.status === OrderStatus.DISPATCHED && t("vendor.markAsDelivered")}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
