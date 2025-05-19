import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Shop } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StoreStatusProps {
  shop: Shop;
}

export function StoreStatus({ shop }: StoreStatusProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const updateShopMutation = useMutation({
    mutationFn: async (isOpen: boolean) => {
      await apiRequest("PUT", `/api/shops/${shop.id}`, { isOpen });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/shops"] });
      toast({
        title: t("vendor.storeStatusUpdated"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("vendor.updateFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleToggle = async (checked: boolean) => {
    await updateShopMutation.mutateAsync(checked);
  };
  
  return (
    <Card className="bg-white rounded-lg shadow-sm mb-6">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-lg">{shop.name}</h2>
            <p className="text-sm text-neutral-400">
              {/* This would come from category data in a real app */}
              {shop.categoryId === 1 ? "General Store" : 
               shop.categoryId === 2 ? "Pharmacy" : 
               shop.categoryId === 3 ? "Jewellery" : 
               shop.categoryId === 4 ? "Vegetables" : "Shop"}
            </p>
          </div>
          <div className="flex items-center">
            <span className="mr-2 text-sm">{t("vendor.storeStatus")}</span>
            <Switch 
              checked={shop.isOpen} 
              onCheckedChange={handleToggle}
              disabled={updateShopMutation.isPending}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
