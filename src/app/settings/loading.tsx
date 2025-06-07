
import { Spinner } from "@/components/ui/spinner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function LoadingSettings() {
  return (
    <AppLayout>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <SettingsIcon className="w-8 h-8 mr-3 text-primary" /> Settings
          </CardTitle>
          <CardDescription>Manage your application and profile settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[300px] items-center justify-center">
            <Spinner size={48} />
            <p className="ml-3 text-muted-foreground">Loading settings...</p>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
