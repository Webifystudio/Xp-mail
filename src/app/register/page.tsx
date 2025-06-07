"use client";

import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Mail } from "lucide-react";

export default function RegisterPage() {
  const { registerUser, loading, error, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  if (user) {
    return null; // Or a loading spinner while redirecting
  }

  // Explicitly type values to match AuthForm's onSubmit expectation
  const handleRegister = async (values: { username: string; email: string; password: string }) => {
    await registerUser(values.username, values.email, values.password);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex flex-col items-center">
        <Mail className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-primary">XPMail</h1>
        <p className="text-muted-foreground">Join the Secure Mail Network</p>
      </div>
      <AuthForm
        isRegisterMode
        onSubmit={handleRegister as any} // Cast to any due to union type in AuthForm
        loading={loading}
        error={error}
      />
    </div>
  );
}
