import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import CustomerLayout from "@/components/customer/layout";
import { CategoryCard } from "@/components/customer/category-card";
import { ShopCard } from "@/components/customer/shop-card";
import { FestivalBanner } from "@/components/customer/festival-banner";
import { Category, Shop } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useCoordinates } from "@/context/CoordinatesContext";
import { useSocket } from "@/hooks/useSocket";

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { coordinates } = useCoordinates();
  
  console.log("coordinates in CustomerDashboard:", coordinates);
  const handleSocketEvent = (event: string, data: any) => {
    if (event === "order-status-update") {
      console.log("Order status updated:", data);
      // Update state/UI based on the event
    }
  };

  useSocket(user?.id, handleSocketEvent);  
  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  useEffect(() => {
    console.log("categories", categories);
  }, [categories]);
  
  
  // Fetch shops (fetch all shops for now, location-based filtering is commented out)
  const { data: shops, isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: coordinates
      ? [`/api/shops?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=5`] // Fetch nearby shops
      : ["/api/shops"], // Fetch all shops if no location is set
    enabled: true,
  });
  useEffect(() => {
    console.log("shops", shops);  
    
  }, [shops]);
  
  useEffect(() => {
    document.title = "ShopLocal - Customer Dashboard";
  }, []);

  return (
    <CustomerLayout>
      <main className="flex-1 container mx-auto px-4 py-4 pb-20">
        {/* Festival Banner */}
        <FestivalBanner 
          title={t("customer.festivals.diwali")}
          description={t("customer.festivals.offers")}
          buttonText={t("customer.festivals.shopNow")}
          festival="diwali"
        />
        
        {/* Categories */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{t("common.categories")}</h2>
            <button className="text-primary text-sm">{t("common.seeAll")}</button>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            {categoriesLoading ? (
              <div className="col-span-4 flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : categories && categories.length > 0 ? (
              categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))
            ) : (
              <div className="col-span-4 text-center py-6 text-muted-foreground">
                No categories found
              </div>
            )}
          </div>
        </section>
        
        {/* Nearby Shops */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{t("customer.nearbyShops")}</h2>
            <div className="flex items-center">
              <span className="text-sm text-neutral-400 mr-2">{t("common.sort")}:</span>
              <select className="text-sm border-none bg-transparent">
                <option>{t("customer.distance")}</option>
                <option>{t("customer.rating")}</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            {shopsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : shops && shops.length > 0 ? (
              shops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))
            ) : (
              <div className="text-center py-8 bg-white rounded-lg shadow-sm p-8">
                <div className="text-neutral-400 mb-2">
                  <i className="fas fa-store text-4xl opacity-30"></i>
                </div>
                <h3 className="text-lg font-medium mb-1">No shops found nearby</h3>
                <p className="text-sm text-neutral-400">Try changing your location or expanding your search radius.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </CustomerLayout>
  );
}
