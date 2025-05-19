import { ReactNode, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Star, 
  Settings, 
  Menu, 
  Bell, 
  LogOut 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface VendorLayoutProps {
  children: ReactNode;
}

interface NavItemProps {
  path: string;
  label: string;
  icon: JSX.Element;
  isActive: boolean;
  onClick: () => void;
}

// Navigation Item Component
function NavItem({ path, label, icon, isActive, onClick }: NavItemProps) {
  return (
    <div 
      onClick={onClick}
      className={`
        flex items-center px-4 py-3 cursor-pointer
        ${isActive 
          ? 'bg-white bg-opacity-10' 
          : 'opacity-70 hover:bg-white hover:bg-opacity-10'}
      `}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </div>
  );
}

// Mobile Navigation Item Component
function MobileNavItem({ path, label, icon, isActive, onClick }: NavItemProps) {
  return (
    <div 
      onClick={onClick}
      className={`
        flex flex-col items-center cursor-pointer
        ${isActive ? 'text-primary' : 'text-neutral-400'}
      `}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </div>
  );
}

// Dropdown Navigation Item Component
function DropdownNavItem({ path, label, icon, onClick }: Omit<NavItemProps, 'isActive'>) {
  return (
    <DropdownMenuItem asChild>
      <div onClick={onClick} className="flex items-center cursor-pointer w-full">
        <span className="mr-2">{icon}</span>
        {label}
      </div>
    </DropdownMenuItem>
  );
}

export default function VendorLayout({ children }: VendorLayoutProps) {
  console.log("VendorLayout children:", children);
  
  const [location, navigate] = useLocation();
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  
  const navItems = [
    { path: "/vendor", label: t("common.dashboard"), icon: <LayoutDashboard className="w-6 h-6" /> },
    { path: "/vendor/inventory", label: t("common.inventory"), icon: <Package className="w-6 h-6" /> },
    { path: "/vendor/orders", label: t("common.orders"), icon: <ShoppingBag className="w-6 h-6" /> },
    { path: "/vendor/reviews", label: t("common.reviews"), icon: <Star className="w-6 h-6" /> },
    { path: "/vendor/settings", label: t("common.settings"), icon: <Settings className="w-6 h-6" /> },
  ];
  
  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  return (
    <div className="flex h-screen bg-neutral-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-secondary text-white">
        <div className="p-4">
          <h1 className="text-xl font-bold">{t("common.shopLocal")}</h1>
          <p className="text-sm opacity-70">{t("vendor.vendorDashboard")}</p>
        </div>
        
        <nav className="mt-6">
          {navItems.map(item => (
            <NavItem
              key={item.path}
              path={item.path}
              label={item.label}
              icon={item.icon}
              isActive={location === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
        </nav>
        
        <div className="mt-auto p-4 border-t border-white border-opacity-10">
          <div className="flex justify-between items-center">
            <LanguageToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white opacity-70 hover:opacity-100"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-secondary text-white p-4 md:hidden">
          <div className="flex justify-between items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>{t("vendor.vendorDashboard")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {navItems.map(item => (
                  <DropdownNavItem
                    key={item.path}
                    path={item.path}
                    label={item.label}
                    icon={item.icon}
                    onClick={() => navigate(item.path)}
                  />
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <h1 className="text-lg font-bold">{t("common.shopLocal")}</h1>
            
            <div className="flex items-center">
              <LanguageToggle />
              <Button variant="ghost" size="icon" className="text-white">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-100 p-4 pb-20 md:pb-4">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] py-2">
          <div className="grid grid-cols-5 gap-1">
            {navItems.map(item => (
              <MobileNavItem
                key={item.path}
                path={item.path}
                label={item.label}
                icon={item.icon}
                isActive={location === item.path}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
