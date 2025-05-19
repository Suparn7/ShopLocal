import { Link } from "wouter";
import { Shop } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { formatDistance } from "@/lib/utils";

interface ShopCardProps {
  shop: Shop;
}

export function ShopCard({ shop }: ShopCardProps) {
  const { t } = useTranslation();
  
  // Calculate distance (would come from API in a real app)
  const distance = shop.latitude && shop.longitude ? 
    Math.random() * 4 + 0.5 : // Random distance for demo
    null;
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="relative">
        <div className="w-full h-32 bg-neutral-100 flex items-center justify-center">
          {shop.image ? (
            <img 
              src={shop.image} 
              alt={shop.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <i className="fas fa-store text-4xl text-neutral-300"></i>
          )}
        </div>
        
        {distance && (
          <div className="absolute top-2 right-2 bg-white bg-opacity-90 text-xs font-medium px-2 py-1 rounded-full">
            {formatDistance(distance)} {t("customer.kmAway")}
          </div>
        )}
        
        {shop.deliveryAvailable && (
          <div className="absolute bottom-2 left-2 bg-primary text-white text-xs font-medium px-2 py-1 rounded-full">
            {t("customer.freeDelivery")}
          </div>
        )}
      </div>
      
      <div className="p-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{shop.name}</h3>
            <p className="text-xs text-neutral-400">
              {/* This would come from category data in a real app */}
              {shop.categoryId === 1 ? "General Store" : 
               shop.categoryId === 2 ? "Pharmacy" : 
               shop.categoryId === 3 ? "Jewellery" : 
               shop.categoryId === 4 ? "Vegetables" : "Shop"}
               
              {shop.openTime && shop.closeTime && (
                <> • {t("customer.openUntil")} {shop.closeTime}</>
              )}
            </p>
          </div>
          <div className="flex items-center bg-success bg-opacity-10 px-2 py-1 rounded">
            <span className="text-success font-medium mr-1">4.2</span>
            <i className="fas fa-star text-success text-xs"></i>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-neutral-400 flex items-center">
          <i className="fas fa-clock mr-1"></i>
          <span>
            {shop.avgDeliveryTime ? 
              t("customer.deliveryTime") + " " + shop.avgDeliveryTime + " " + t("customer.minutes") : 
              t("customer.deliveryTime") + " 20-30 " + t("customer.minutes")}
          </span>
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <span className="text-xs">
            {shop.isGstVerified && (
              <>
                <i className="fas fa-check-circle text-success mr-1"></i>
                {t("customer.gstCompliant")}
              </>
            )}
          </span>
          <Link href={`/customer/shop/${shop.id}`}>
            <a className="bg-primary text-white text-sm px-3 py-1 rounded">
              {t("customer.visitShop")}
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
