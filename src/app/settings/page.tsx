
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, UserCircle, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppLayout>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <SettingsIcon className="w-8 h-8 mr-3 text-primary" /> Settings
          </CardTitle>
          <CardDescription>Manage your application and profile settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <UserCircle className="w-6 h-6 mr-2 text-muted-foreground" /> Profile Settings
            </h2>
            <div className="p-6 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Profile settings are not yet implemented.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Soon you'll be able to update your username, email, and password here.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Bell className="w-6 h-6 mr-2 text-muted-foreground" /> Notification Settings
            </h2>
            <div className="p-6 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Notification settings are not yet implemented.</p>
               <p className="text-sm text-muted-foreground mt-2">
                Configure your email and in-app notification preferences.
              </p>
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Shield className="w-6 h-6 mr-2 text-muted-foreground" /> Account Security
            </h2>
            <div className="p-6 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Account security options are not yet implemented.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Manage two-factor authentication and view active sessions.
              </p>
            </div>
          </section>

        </CardContent>
      </Card>
    </AppLayout>
  );
}
