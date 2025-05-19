import { ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  LayoutGrid, 
  BarChart3, 
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

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  
  const navItems = [
    { path: "/admin", label: t("common.dashboard"), icon: <LayoutDashboard className="w-6 h-6" /> },
    { path: "/admin/vendors", label: t("common.vendors"), icon: <Store className="w-6 h-6" /> },
    { path: "/admin/customers", label: t("common.customers"), icon: <Users className="w-6 h-6" /> },
    { path: "/admin/categories", label: t("common.categories"), icon: <LayoutGrid className="w-6 h-6" /> },
    { path: "/admin/analytics", label: t("common.analytics"), icon: <BarChart3 className="w-6 h-6" /> },
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
          <p className="text-sm opacity-70">{t("admin.adminDashboard")}</p>
        </div>
        
        <nav className="mt-6">
          {navItems.map(item => (
            <Link key={item.path} href={item.path}>
              <a className={`
                flex items-center px-4 py-3 
                ${location === item.path 
                  ? 'bg-white bg-opacity-10' 
                  : 'opacity-70 hover:bg-white hover:bg-opacity-10'}
              `}>
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </a>
            </Link>
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
                <DropdownMenuLabel>{t("admin.adminDashboard")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {navItems.map(item => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link href={item.path}>
                      <a className="flex items-center cursor-pointer">
                        <span className="mr-2">{item.icon}</span>
                        {item.label}
                      </a>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <h1 className="text-lg font-bold">{t("admin.adminDashboard")}</h1>
            
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
              <Link key={item.path} href={item.path}>
                <a className={`
                  flex flex-col items-center
                  ${location === item.path ? 'text-primary' : 'text-neutral-400'}
                `}>
                  {item.icon}
                  <span className="text-xs mt-1">{item.label}</span>
                </a>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
