import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { PhoneAuthForm } from "@/components/auth/phone-auth-form";
import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useTranslation } from "react-i18next";

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<"phone" | "email">("phone");
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t("auth.pageTitle");
  }, [t]);

  // Redirect if already logged in
  if (user && !isLoading) {
    if (user.role === "customer") {
      return <Redirect to="/customer" />;
    } else if (user.role === "vendor") {
      return <Redirect to="/vendor" />;
    } else if (user.role === "admin") {
      return <Redirect to="/admin" />;
    }
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4 py-10">
      <div className="w-full max-w-md">
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-secondary">{t("auth.loginSignup")}</h2>
              <LanguageToggle />
            </div>

            <Tabs defaultValue="phone" value={authMode} onValueChange={(v) => setAuthMode(v as "phone" | "email")}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="phone">{t("auth.phone")}</TabsTrigger>
                <TabsTrigger value="email">{t("auth.email")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="phone" className="space-y-4">
                <PhoneAuthForm />
              </TabsContent>
              
              <TabsContent value="email" className="space-y-4">
                <EmailAuthForm />
              </TabsContent>
            </Tabs>
            
            <div className="mt-4 text-xs text-center text-muted-foreground">
              {t("auth.termsText")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
