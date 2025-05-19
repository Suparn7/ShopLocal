import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import VendorLayout from "@/components/vendor/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Review, Shop, User } from "@shared/schema";
import { useTranslation } from "react-i18next";

export default function VendorReviews() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedShopId, setSelectedShopId] = useState<number | undefined>(undefined);
  const [sortOption, setSortOption] = useState<string>("latest");
  
  // Fetch vendor shops
  const { data: shops, isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ["/api/vendor/shops"],
    enabled: !!user,
  });
  
  // Set the first shop as selected if not already set
  useEffect(() => {
    if (shops && shops.length > 0 && !selectedShopId) {
      setSelectedShopId(shops[0].id);
    }
  }, [shops, selectedShopId]);
  
  // Fetch reviews for selected shop
  const { data: reviews, isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: [`/api/shops/${selectedShopId}/reviews`],
    enabled: !!selectedShopId,
  });
  
  // Fetch customers
  const { data: customers, isLoading: customersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/customers"],
    enabled: !!reviews && reviews.length > 0,
  });
  
  const isLoading = shopsLoading || reviewsLoading || customersLoading;
  
  // Sort reviews
  const sortedReviews = reviews ? [...reviews] : [];
  
  if (sortOption === "latest") {
    sortedReviews.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else if (sortOption === "highest") {
    sortedReviews.sort((a, b) => b.rating - a.rating);
  } else if (sortOption === "lowest") {
    sortedReviews.sort((a, b) => a.rating - b.rating);
  }
  
  // Get customer name by ID
  const getCustomerName = (customerId: number): string => {
    if (!customers) return `Customer #${customerId}`;
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || `Customer #${customerId}`;
  };
  
  // Calculate rating statistics
  const calculateRatingStats = () => {
    if (!reviews || reviews.length === 0) {
      return {
        average: 0,
        count: 0,
        distribution: [0, 0, 0, 0, 0]
      };
    }
    
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / reviews.length;
    
    const distribution = [0, 0, 0, 0, 0]; // 5 stars to 1 star
    reviews.forEach(review => {
      distribution[5 - review.rating]++;
    });
    
    return {
      average,
      count: reviews.length,
      distribution
    };
  };
  
  const ratingStats = calculateRatingStats();
  
  useEffect(() => {
    document.title = "Customer Reviews - ShopLocal";
  }, []);

  return (
    <VendorLayout>
      <div className="max-w-5xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-lg font-semibold">{t("vendor.customerReviews")}</h2>
              
              <div className="flex items-center space-x-4 w-full sm:w-auto">
                {shops && shops.length > 1 && (
                  <Select 
                    value={selectedShopId?.toString()} 
                    onValueChange={(value) => setSelectedShopId(parseInt(value))}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder={t("vendor.selectShop")} />
                    </SelectTrigger>
                    <SelectContent>
                      {shops.map(shop => (
                        <SelectItem key={shop.id} value={shop.id.toString()}>
                          {shop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                <Select 
                  value={sortOption} 
                  onValueChange={setSortOption}
                >
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder={t("vendor.sortBy")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">{t("vendor.latestFirst")}</SelectItem>
                    <SelectItem value="highest">{t("vendor.highestRated")}</SelectItem>
                    <SelectItem value="lowest">{t("vendor.lowestRated")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {!selectedShopId ? (
              <div className="text-center py-8">
                <div className="text-neutral-400 mb-4">
                  <i className="fas fa-store text-5xl opacity-30"></i>
                </div>
                <h3 className="text-lg font-medium mb-2">{t("vendor.noShops")}</h3>
                <p className="text-sm text-muted-foreground">{t("vendor.createShopFirst")}</p>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Rating Summary */}
                <div className="bg-white rounded-lg border p-4">
                  <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-8">
                    <div className="flex flex-col items-center">
                      <div className="text-5xl font-bold">{ratingStats.average.toFixed(1)}</div>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <i 
                            key={i} 
                            className={`fas fa-star ${i < Math.round(ratingStats.average) ? 'text-amber-400' : 'text-neutral-200'}`}
                          ></i>
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {ratingStats.count} {t("common.reviews")}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      {[5, 4, 3, 2, 1].map(rating => {
                        const count = ratingStats.distribution[5 - rating];
                        const percentage = ratingStats.count > 0 
                          ? (count / ratingStats.count) * 100 
                          : 0;
                        
                        return (
                          <div key={rating} className="flex items-center text-sm mb-1">
                            <span className="w-3">{rating}</span>
                            <i className="fas fa-star text-amber-400 mx-1 text-xs"></i>
                            <div className="flex-1 mx-2 bg-neutral-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-amber-400 h-full rounded-full" 
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
                
                {/* Review List */}
                {!reviews || reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-neutral-400 mb-4">
                      <i className="fas fa-star text-5xl opacity-30"></i>
                    </div>
                    <h3 className="text-lg font-medium mb-2">{t("vendor.noReviews")}</h3>
                    <p className="text-sm text-muted-foreground">{t("vendor.waitingForReviews")}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedReviews.map(review => (
                      <div key={review.id} className="bg-white rounded-lg border p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{getCustomerName(review.customerId)}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="font-medium mr-1">{review.rating}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <i 
                                  key={i} 
                                  className={`fas fa-star ${i < review.rating ? 'text-amber-400' : 'text-neutral-200'}`}
                                ></i>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {review.comment && (
                          <div className="mt-3 text-sm">
                            {review.comment}
                          </div>
                        )}
                        
                        {review.orderId && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {t("vendor.orderId")}: #{review.orderId}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  );
}
