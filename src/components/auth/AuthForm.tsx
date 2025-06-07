"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, User as UserIcon, LogIn } from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface AuthFormProps {
  isRegisterMode?: boolean;
  onSubmit: (values: LoginFormValues | RegisterFormValues) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export function AuthForm({ isRegisterMode = false, onSubmit, loading, error }: AuthFormProps) {
  const schema = isRegisterMode ? registerSchema : loginSchema;
  const form = useForm<LoginFormValues | RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: isRegisterMode 
      ? { username: "", email: "", password: "" } 
      : { email: "", password: "" },
  });

  const handleSubmit = async (values: LoginFormValues | RegisterFormValues) => {
    await onSubmit(values);
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline">
          {isRegisterMode ? "Create Account" : "Welcome Back!"}
        </CardTitle>
        <CardDescription>
          {isRegisterMode ? "Join XPMail today." : "Log in to access your XPMail account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {isRegisterMode && (
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm font-medium text-destructive">{error.message}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner size={20} className="mr-2" /> : <LogIn className="mr-2 h-4 w-4" />}
              {loading ? (isRegisterMode ? "Registering..." : "Logging in...") : (isRegisterMode ? "Register" : "Login")}
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center text-sm">
          {isRegisterMode ? (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
