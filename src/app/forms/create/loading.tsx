
import { Spinner } from "@/components/ui/spinner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoadingCreateForm() {
  return (
    <AppLayout>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Create New Form</CardTitle>
          <CardDescription>Loading form builder...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[300px] items-center justify-center">
            <Spinner size={48} />
            <p className="ml-3 text-muted-foreground">Initializing editor...</p>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
