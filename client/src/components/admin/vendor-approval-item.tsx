import { useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shop, User } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface VendorApprovalItemProps {
  shop: Shop;
  vendors: User[];
}

export function VendorApprovalItem({ shop, vendors }: VendorApprovalItemProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Find vendor for this shop
  const vendor = vendors.find(v => v.id === shop.vendorId);
  
  // Get days since registration
  const daysSinceRegistration = () => {
    const registrationDate = new Date(shop.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - registrationDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Approve shop mutation
  const approveShopMutation = useMutation({
    mutationFn: async (shopId: number) => {
      await apiRequest("POST", `/api/admin/shops/${shopId}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: t("admin.shopApproved"),
        description: t("admin.shopApprovalSuccess"),
      });
      setDetailsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shops"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("admin.approvalFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Reject shop mutation (in a real app, this would be a different endpoint)
  const rejectShopMutation = useMutation({
    mutationFn: async (shopId: number) => {
      // In a real app, this would be a DELETE or a specific reject endpoint
      await apiRequest("DELETE", `/api/shops/${shopId}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: t("admin.shopRejected"),
        description: t("admin.shopRejectionSuccess"),
      });
      setDetailsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shops"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("admin.rejectionFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle approve
  const handleApprove = async () => {
    await approveShopMutation.mutateAsync(shop.id);
  };
  
  // Handle reject
  const handleReject = async () => {
    if (confirm(t("admin.confirmRejectShop"))) {
      await rejectShopMutation.mutateAsync(shop.id);
    }
  };
  
  return (
    <tr className="hover:bg-neutral-50">
      <td className="px-3 py-3">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mr-3">
            <i className="fas fa-store text-primary"></i>
          </div>
          <div>
            <div className="font-medium">{shop.name}</div>
            <div className="text-xs text-muted-foreground">
              {t("admin.registered")} {daysSinceRegistration()} {t("admin.daysAgo")}
            </div>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-sm">
        {/* This would come from category data in a real app */}
        {shop.categoryId === 1 ? "General Store" : 
         shop.categoryId === 2 ? "Pharmacy" : 
         shop.categoryId === 3 ? "Jewellery" : 
         shop.categoryId === 4 ? "Vegetables" : "Shop"}
      </td>
      <td className="px-3 py-3 text-sm">
        {shop.address}, {shop.city}
      </td>
      <td className="px-3 py-3 text-sm">
        <Badge variant={shop.isGstVerified ? "default" : "outline"} className={shop.isGstVerified ? "bg-green-100 text-green-800" : ""}>
          {shop.isGstVerified ? t("admin.verified") : t("admin.pending")}
        </Badge>
      </td>
      <td className="px-3 py-3 text-sm">
        <div className="flex space-x-2">
          {!shop.isApproved && (
            <>
              <Button 
                size="sm" 
                className="bg-success hover:bg-success/90 bg-teal-500 text-white"
                onClick={handleApprove}
                disabled={approveShopMutation.isPending}
              >
                {t("admin.approve")}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-neutral-600"
                onClick={handleReject}
                disabled={rejectShopMutation.isPending}
              >
                {t("admin.reject")}
              </Button>
            </>
          )}
          
          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary"
                onClick={() => setDetailsOpen(true)}
              >
                {t("admin.details")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t("admin.shopDetails")}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <div className="font-medium text-lg">{shop.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {shop.categoryId === 1 ? "General Store" : 
                     shop.categoryId === 2 ? "Pharmacy" : 
                     shop.categoryId === 3 ? "Jewellery" : 
                     shop.categoryId === 4 ? "Vegetables" : "Shop"}
                  </div>
                </div>
                
                {vendor && (
                  <div>
                    <div className="text-sm font-medium mb-1">{t("admin.vendorDetails")}</div>
                    <div className="bg-neutral-50 p-3 rounded-md">
                      <div className="flex flex-col space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{t("admin.name")}</span>
                          <span className="text-sm">{vendor.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{t("admin.email")}</span>
                          <span className="text-sm">{vendor.email || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{t("admin.phone")}</span>
                          <span className="text-sm">{vendor.phone || "-"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <div className="text-sm font-medium mb-1">{t("admin.shopAddress")}</div>
                  <div className="bg-neutral-50 p-3 rounded-md">
                    <p className="text-sm">
                      {shop.address}, {shop.city}, {shop.state}
                      {shop.postalCode && ` - ${shop.postalCode}`}
                    </p>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-1">{t("admin.gstDetails")}</div>
                  <div className="bg-neutral-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        {shop.gstin ? shop.gstin : t("admin.noGstinProvided")}
                      </div>
                      <Badge variant={shop.isGstVerified ? "default" : "outline"} className={shop.isGstVerified ? "bg-green-100 text-green-800" : ""}>
                        {shop.isGstVerified ? t("admin.verified") : t("admin.pending")}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {!shop.isApproved && (
                  <div className="flex space-x-2 pt-4">
                    <Button 
                      className="flex-1 bg-success hover:bg-success/90 bg-teal-500 text-white"
                      onClick={handleApprove}
                      disabled={approveShopMutation.isPending}
                    >
                      {t("admin.approve")}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 text-neutral-600"
                      onClick={handleReject}
                      disabled={rejectShopMutation.isPending}
                    >
                      {t("admin.reject")}
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </td>
    </tr>
  );
}
