
import { Spinner } from "@/components/ui/spinner";
import { AppLayout } from "@/components/layout/AppLayout";

export default function Loading() {
  return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Spinner size={48} />
        <p className="ml-3 text-muted-foreground">Loading dashboard...</p>
      </div>
    </AppLayout>
  );
}
