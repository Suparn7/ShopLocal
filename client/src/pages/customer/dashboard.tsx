import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import CustomerLayout from "@/components/customer/layout";
import { CategoryCard } from "@/components/customer/category-card";
import { ShopCard } from "@/components/customer/shop-card";
import { FestivalBanner } from "@/components/customer/festival-banner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Category, Shop } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useCoordinates } from "@/context/CoordinatesContext";
import { useSocket } from "@/hooks/useSocket";
import { isWithinRadius } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();
  const { coordinates } = useCoordinates();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleSocketEvent = (event: string, data: any) => {
    if (event === "shop-added") {
      console.log("Shop added:", data);

      if (isWithinRadius(data.latitude, data.longitude, coordinates.lat, coordinates.lng, 5)) {
        setShops((prevShops) => [...prevShops, data]);
      }

      queryClient.invalidateQueries({
        queryKey: coordinates
          ? [`/api/shops?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=5`]
          : ["/api/shops"],
      });
    }

    if (event === "shop-updated") {
      console.log("Shop updated:", data);

      setShops((prevShops) =>
        prevShops.map((shop) =>
          shop.id === data.id ? { ...shop, ...data } : shop
        )
      );

      queryClient.invalidateQueries({
        queryKey: coordinates
          ? [`/api/shops?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=5`]
          : ["/api/shops"],
      });
    }

    if (event === "shop-deleted") {
      console.log("Shop deleted:", data);

      setShops((prevShops) =>
        prevShops.filter((shop) => shop.id !== data.shopId)
      );

      queryClient.invalidateQueries({
        queryKey: coordinates
          ? [`/api/shops?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=5`]
          : ["/api/shops"],
      });
    }

    if (event === "shop-toggled") {
      console.log("Shop toggled:", data);

      setShops((prevShops) =>
        prevShops.map((shop) =>
          shop.id === data.id ? { ...shop, isOpen: data.isOpen } : shop
        )
      );

      queryClient.invalidateQueries({
        queryKey: coordinates
          ? [`/api/shops?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=5`]
          : ["/api/shops"],
      });
    }
  };

  useSocket(user?.id, user?.role, handleSocketEvent);

  const { data: categoryShops, isLoading: categoryShopsLoading } = useQuery<Shop[]>({
    queryKey: selectedCategory ? [`/api/shops?categoryId=${selectedCategory.id}`] : [],
    enabled: !!selectedCategory,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  useEffect(() => {
    console.log("categories", categories);
  }, [categories]);

  const { data: fetchedShops, isLoading: nearbyShopsLoading, refetch } = useQuery<Shop[]>({
    queryKey: coordinates
      ? [`/api/shops?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=5`]
      : ["/api/shops"],
    enabled: true,
  });

  useEffect(() => {
    if (fetchedShops) {
      console.log("fetchedShops", fetchedShops);
      setShops(fetchedShops);
    }
  }, [fetchedShops]);

  useEffect(() => {
    refetch();
  }, [location, refetch]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refetch]);

  useEffect(() => {
    document.title = "ShopLocal - Customer Dashboard";
  }, []);

  return (
    <CustomerLayout>
      <main className="flex-1 container mx-auto px-4 py-4 pb-20">
        <FestivalBanner
          title={t("customer.festivals.diwali")}
          description={t("customer.festivals.offers")}
          buttonText={t("customer.festivals.shopNow")}
          festival="diwali"
        />

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
                <CategoryCard
                  key={category.id}
                  category={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setIsModalOpen(true);
                  }}
                />
              ))
            ) : (
              <div className="col-span-4 text-center py-6 text-muted-foreground">
                No categories found
              </div>
            )}
          </div>
        </section>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {selectedCategory ? `${selectedCategory.name} Shops` : "Shops"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {categoryShopsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : categoryShops && categoryShops.length > 0 ? (
                categoryShops.map((shop) => (
                  <div
                    key={shop.id}
                    className="flex justify-between items-center bg-white rounded-lg shadow p-4"
                  >
                    <div>
                      <h3 className="font-medium">{shop.name}</h3>
                      <p className="text-sm text-muted-foreground">{shop.address}</p>
                    </div>
                    <button
                      className="text-primary text-sm"
                      onClick={() => (window.location.href = `/customer/shop/${shop.id}`)}
                    >
                      Visit Shop
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No shops found for this category.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

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
            {nearbyShopsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : shops && shops.length > 0 ? (
              shops.map((shop) => <ShopCard key={shop.id} shop={shop} />)
            ) : (
              <div className="text-center py-8 bg-white rounded-lg shadow-sm p-8">
                <div className="text-neutral-400 mb-2">
                  <i className="fas fa-store text-4xl opacity-30"></i>
                </div>
                <h3 className="text-lg font-medium mb-1">No shops found nearby</h3>
                <p className="text-sm text-neutral-400">
                  Try changing your location or expanding your search radius.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </CustomerLayout>
  );
}