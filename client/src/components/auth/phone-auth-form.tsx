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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useTranslation } from "react-i18next";

// Phone number validation for Indian numbers
const phoneSchema = z.object({
  phone: z.string().length(10, { message: "Must be exactly 10 digits" })
    .regex(/^[6-9]\d{9}$/, { message: "Invalid Indian phone number" }),
  name: z.string().optional(),
  role: z.string().optional(),
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: "OTP must be 6 digits" })
});

export function PhoneAuthForm() {
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [phoneNumber, setPhoneNumber] = useState("");
  const { phoneAuthMutation, verifyOtpMutation } = useAuth();
  const { t } = useTranslation();

  // Form for phone number entry
  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
      name: "",
      role: UserRole.CUSTOMER,
    },
  });

  // Form for OTP verification
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onPhoneSubmit = async (data: z.infer<typeof phoneSchema>) => {
    await phoneAuthMutation.mutateAsync({
      phone: data.phone,
      name: data.name,
      role: data.role,
    });
    setPhoneNumber(data.phone);
    setStep("OTP");
  };

  const onOtpSubmit = async (data: z.infer<typeof otpSchema>) => {
    await verifyOtpMutation.mutateAsync({
      phone: phoneNumber,
      otp: data.otp,
    });
  };

  return (
    <div className="space-y-4">
      {step === "PHONE" ? (
        <Form {...phoneForm}>
          <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
            <FormField
              control={phoneForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.phoneNumber")}</FormLabel>
                  <div className="flex">
                    <div className="bg-neutral-100 px-3 py-2 rounded-l-lg border border-r-0 border-neutral-200 flex items-center">
                      +91
                    </div>
                    <FormControl>
                      <Input 
                        {...field}
                        type="tel" 
                        className="rounded-l-none" 
                        placeholder={t("auth.enterPhone")}
                        maxLength={10}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={phoneForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.name")} ({t("auth.optional")})</FormLabel>
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

            <RoleSelector control={phoneForm.control} />

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={phoneAuthMutation.isPending}
            >
              {phoneAuthMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("auth.sendOTP")}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                {t("auth.otpSentText")} <span className="font-semibold">+91 {phoneNumber}</span>
              </p>
            </div>

            <FormField
              control={otpForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem className="mx-auto max-w-xs">
                  <FormLabel className="text-center block">{t("auth.enterOTP")}</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col space-y-2">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={verifyOtpMutation.isPending}
              >
                {verifyOtpMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("auth.verifyOTP")}
              </Button>
              
              <Button 
                type="button" 
                variant="ghost" 
                className="text-sm"
                onClick={() => setStep("PHONE")}
                disabled={phoneAuthMutation.isPending}
              >
                {t("auth.changeMobile")}
              </Button>
              
              <Button 
                type="button" 
                variant="link" 
                className="text-sm"
                onClick={() => {
                  // In a real app, we would implement resend logic
                  phoneAuthMutation.mutate({
                    phone: phoneNumber
                  });
                }}
                disabled={phoneAuthMutation.isPending}
              >
                {phoneAuthMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("auth.resendOTP")}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
