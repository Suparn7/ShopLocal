import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Home, Search, ShoppingBag, User, ShoppingCart } from "lucide-react";

interface BottomNavProps {
  currentPath: string;
}

export function BottomNav({ currentPath }: BottomNavProps) {
  const { t } = useTranslation();
  
  const navItems = [
    { path: "/customer", label: t("common.home"), icon: Home },
    { path: "/customer/search", label: t("common.search"), icon: Search },
    // { path: "/customer/cart", label: t("common.cart"), icon: ShoppingCart }, // Added Cart Tab
    { path: "/customer/orders", label: t("common.orders"), icon: ShoppingBag },
    { path: "/customer/profile", label: t("common.profile"), icon: User },
  ];
  
  return (
    <nav className="bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] fixed bottom-0 left-0 right-0 z-10">
      <div className="grid grid-cols-4 py-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = 
            item.path === "/customer" ? 
            currentPath === "/customer" : 
            currentPath.startsWith(item.path);
          
          return (
            <Link key={item.path} href={item.path}>
              <div className={`flex flex-col items-center ${isActive ? 'text-primary' : 'text-neutral-400'} cursor-pointer`}>
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
