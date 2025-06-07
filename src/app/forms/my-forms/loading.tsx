
import { Spinner } from "@/components/ui/spinner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LoadingMyForms() {
  return (
    <AppLayout>
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-headline">My Forms</CardTitle>
            <CardDescription>View, manage, and analyze your created forms.</CardDescription>
          </div>
           <Button asChild disabled>
            <Link href="/forms/create">
              <FilePlus2 className="mr-2 h-5 w-5" /> Create New Form
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[200px] items-center justify-center">
            <Spinner size={48} />
            <p className="ml-3 text-muted-foreground">Loading your forms...</p>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
