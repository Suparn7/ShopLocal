import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser, UserRole } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  emailLoginMutation: UseMutationResult<Partial<SelectUser>, Error, EmailLoginData>;
  emailRegisterMutation: UseMutationResult<Partial<SelectUser>, Error, EmailRegisterData>;
  phoneAuthMutation: UseMutationResult<PhoneAuthResponse, Error, PhoneAuthData>;
  verifyOtpMutation: UseMutationResult<Partial<SelectUser>, Error, VerifyOtpData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  setLanguageMutation: UseMutationResult<Partial<SelectUser>, Error, {language: string}>;
};

type EmailLoginData = {
  email: string;
  password: string;
};

type EmailRegisterData = {
  name: string;
  email: string;
  password: string;
  role: string;
};

type PhoneAuthData = {
  phone: string;
  name?: string;
  role?: string;
};

type PhoneAuthResponse = {
  message: string;
  phone: string;
};

type VerifyOtpData = {
  phone: string;
  otp: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<Partial<SelectUser> | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const emailLoginMutation = useMutation({
    mutationFn: async (credentials: EmailLoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (user: Partial<SelectUser>) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const emailRegisterMutation = useMutation({
    mutationFn: async (credentials: EmailRegisterData) => {
      const res = await apiRequest("POST", "/api/auth/register", credentials);
      return await res.json();
    },
    onSuccess: (user: Partial<SelectUser>) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const phoneAuthMutation = useMutation({
    mutationFn: async (data: PhoneAuthData) => {
      const res = await apiRequest("POST", "/api/auth/phone", data);
      return await res.json();
    },
    onSuccess: (response: PhoneAuthResponse) => {
      toast({
        title: "OTP Sent",
        description: "Please enter the OTP sent to your phone",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Phone authentication failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: VerifyOtpData) => {
      const res = await apiRequest("POST", "/api/auth/verify-otp", data);
      return await res.json();
    },
    onSuccess: (user: Partial<SelectUser>) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Authentication successful",
        description: `Welcome, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "OTP verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const setLanguageMutation = useMutation({
    mutationFn: async (data: {language: string}) => {
      const res = await apiRequest("POST", "/api/auth/language", data);
      return await res.json();
    },
    onSuccess: (user: Partial<SelectUser>) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Language updated",
        description: user.language === "en" ? "Language set to English" : "भाषा हिंदी पर सेट है",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update language",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user as SelectUser | null,
        isLoading,
        error: error as Error,
        emailLoginMutation,
        emailRegisterMutation,
        phoneAuthMutation,
        verifyOtpMutation,
        logoutMutation,
        setLanguageMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
