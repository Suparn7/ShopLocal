import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { RoleSelector } from "@/components/auth/role-selector";
import { UserRole } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

// Login schema
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// Registration schema
const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  role: z.string(),
});

export function EmailAuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { emailLoginMutation, emailRegisterMutation } = useAuth();
  const { t } = useTranslation();

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: UserRole.CUSTOMER,
    },
  });

  const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
    await emailLoginMutation.mutateAsync(data);
  };

  const onRegisterSubmit = async (data: z.infer<typeof registerSchema>) => {
    await emailRegisterMutation.mutateAsync(data);
  };

  return (
    <Tabs defaultValue="login" value={mode} onValueChange={(v) => setMode(v as "login" | "register")}>
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
        <TabsTrigger value="register">{t("auth.register")}</TabsTrigger>
      </TabsList>
      
      <TabsContent value="login">
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.email")}</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      type="email" 
                      placeholder={t("auth.enterEmail")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.password")}</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      type="password" 
                      placeholder={t("auth.enterPassword")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={emailLoginMutation.isPending}
            >
              {emailLoginMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("auth.login")}
            </Button>
          </form>
        </Form>
      </TabsContent>
      
      <TabsContent value="register">
        <Form {...registerForm}>
          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
            <FormField
              control={registerForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.name")}</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      placeholder={t("auth.enterName")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={registerForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.email")}</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      type="email" 
                      placeholder={t("auth.enterEmail")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={registerForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.password")}</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      type="password" 
                      placeholder={t("auth.enterPassword")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <RoleSelector control={registerForm.control} />

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={emailRegisterMutation.isPending}
            >
              {emailRegisterMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("auth.register")}
            </Button>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
