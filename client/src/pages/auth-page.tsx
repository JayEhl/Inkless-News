import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Book } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { loginMutation, user } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Add effect to handle navigation after successful login
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-lg shadow-sm border border-border p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Book className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Welcome to Inkless News</h1>
          <p className="text-muted-foreground mt-2 font-serif">Your personalized Sunday newspaper</p>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground font-serif">
              Username
            </label>
            <input
              id="username"
              type="text"
              {...form.register("username")}
              className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md text-sm shadow-sm placeholder-muted-foreground
                focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-serif"
              placeholder="Enter your username"
            />
            {form.formState.errors.username && (
              <p className="mt-1 text-sm text-destructive font-serif">{form.formState.errors.username.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground font-serif">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...form.register("password")}
              className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md text-sm shadow-sm placeholder-muted-foreground
                focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-serif"
              placeholder="Enter your password"
            />
            {form.formState.errors.password && (
              <p className="mt-1 text-sm text-destructive font-serif">{form.formState.errors.password.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground
              bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
              disabled:opacity-50 disabled:cursor-not-allowed font-serif"
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
