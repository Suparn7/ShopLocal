import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/admin/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Mock data for charts - in a real app, this would come from API
const generateRevenueData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    name: month,
    revenue: Math.floor(Math.random() * 100000) + 20000
  }));
};

const generateOrdersData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    name: month,
    orders: Math.floor(Math.random() * 500) + 100
  }));
};

const generateCategoryData = () => {
  return [
    { name: 'General Store', value: 42 },
    { name: 'Pharmacy', value: 18 },
    { name: 'Jewellery', value: 12 },
    { name: 'Vegetables', value: 15 },
    { name: 'Others', value: 20 }
  ];
};

const generateUserData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    name: month,
    customers: Math.floor(Math.random() * 100) + 50,
    vendors: Math.floor(Math.random() * 20) + 5
  }));
};

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

export default function AdminAnalytics() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const revenueData = generateRevenueData();
  const ordersData = generateOrdersData();
  const categoryData = generateCategoryData();
  const userData = generateUserData();
  
  // Calculate summary statistics
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = ordersData.reduce((sum, item) => sum + item.orders, 0);
  const totalCustomers = userData.reduce((sum, item) => sum + item.customers, 0);
  const totalVendors = userData.reduce((sum, item) => sum + item.vendors, 0);
  
  useEffect(() => {
    document.title = "Analytics Dashboard - ShopLocal";
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">{t("admin.totalRevenue")}</div>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <div className="text-xs text-success mt-1">
                <i className="fas fa-arrow-up"></i> 15% {t("admin.yearlyGrowth")}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">{t("admin.totalOrders")}</div>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <div className="text-xs text-success mt-1">
                <i className="fas fa-arrow-up"></i> 8% {t("admin.yearlyGrowth")}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">{t("admin.totalCustomers")}</div>
              <div className="text-2xl font-bold">{totalCustomers}</div>
              <div className="text-xs text-success mt-1">
                <i className="fas fa-arrow-up"></i> 22% {t("admin.yearlyGrowth")}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">{t("admin.totalVendors")}</div>
              <div className="text-2xl font-bold">{totalVendors}</div>
              <div className="text-xs text-success mt-1">
                <i className="fas fa-arrow-up"></i> 10% {t("admin.yearlyGrowth")}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Revenue Chart */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t("admin.revenueAnalytics")}</CardTitle>
              <Select defaultValue="year">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("admin.timePeriod")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year">{t("admin.thisYear")}</SelectItem>
                  <SelectItem value="quarter">{t("admin.lastQuarter")}</SelectItem>
                  <SelectItem value="month">{t("admin.lastMonth")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenueData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), t("admin.revenue")]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Orders Chart */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t("admin.orderAnalytics")}</CardTitle>
              <Select defaultValue="year">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("admin.timePeriod")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year">{t("admin.thisYear")}</SelectItem>
                  <SelectItem value="quarter">{t("admin.lastQuarter")}</SelectItem>
                  <SelectItem value="month">{t("admin.lastMonth")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ordersData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="var(--chart-2)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Category Distribution & User Growth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.categoryDistribution")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} shops`, null]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* User Growth */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.userGrowth")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={userData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="customers" fill="var(--chart-1)" />
                    <Bar dataKey="vendors" fill="var(--chart-3)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
