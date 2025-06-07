"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, User, LayoutDashboard, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardPage() {
  const { user, username, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size={48} />
      </div>
    );
  }

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };
  
  return (
    <AppLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4 border-2 border-primary">
                <AvatarImage src={user.photoURL || undefined} alt={username || user.email || "User"} data-ai-hint="abstract human" />
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {getInitials(username, user.email)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl font-headline">{username || "User"}</CardTitle>
              <CardDescription className="flex items-center text-muted-foreground">
                <Mail className="w-4 h-4 mr-2" /> {user.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
               <Button variant="outline" className="w-full">
                <User className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline flex items-center">
                <LayoutDashboard className="w-6 h-6 mr-3 text-primary" /> Welcome to Your Dashboard
              </CardTitle>
              <CardDescription>Manage your account, forms, and other application features.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  This is your central hub. Use the sidebar to navigate to different sections of the application,
                  such as creating new forms or viewing existing ones.
                </p>
                <div className="text-center py-8 bg-muted rounded-md">
                  <Edit3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Get Started</h3>
                  <p className="text-muted-foreground">
                    Try creating a new form using the "Create Form" link in the sidebar!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
