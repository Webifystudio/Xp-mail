"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, User, Inbox, Send, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

export default function HomePage() {
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
                <AvatarImage src={user.photoURL || undefined} alt={username || user.email || "User"} data-ai-hint="abstract avatar" />
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
                <Inbox className="w-6 h-6 mr-3 text-primary" /> Your Mailbox
              </CardTitle>
              <CardDescription>Access your emails and manage your communications.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Quick Actions</h3>
                  <Button>
                    <Edit3 className="w-4 h-4 mr-2" /> Compose New Mail
                  </Button>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { icon: Inbox, label: "Inbox", count: 5, color: "text-primary" },
                    { icon: Send, label: "Sent", count: 23, color: "text-green-500" },
                    { icon: Trash2, label: "Trash", count: 2, color: "text-red-500" },
                  ].map(item => (
                    <Card key={item.label} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center space-x-3">
                        <item.icon className={`w-8 h-8 ${item.color}`} />
                        <div>
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                          <p className="text-xl font-semibold">{item.count}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                 <Separator />
                <div className="text-center py-8 bg-muted rounded-md">
                  <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Mail Functionality Coming Soon</h3>
                  <p className="text-muted-foreground">
                    We're working hard to bring you a full-featured mail experience.
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
