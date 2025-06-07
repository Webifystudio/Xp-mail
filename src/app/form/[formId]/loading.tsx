
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Minimal layout for public form loading state
function PublicFormLoadingLayout({ children }: { children: React.ReactNode; }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
      <div className="w-full max-w-2xl">
        {children}
      </div>
       <footer className="py-6 mt-8 text-center text-sm text-muted-foreground relative z-10">
        <span className="bg-background/70 px-2 py-1 rounded">Powered by XPMail & Forms</span>
      </footer>
    </div>
  );
}

export default function LoadingPublicForm() {
  return (
    <PublicFormLoadingLayout>
        <Card className="shadow-lg">
            <CardHeader className="items-center">
                <CardTitle className="text-2xl">Loading Form</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-10">
                <Spinner size={48} />
                <p className="mt-4 text-muted-foreground">Please wait while the form loads...</p>
            </CardContent>
        </Card>
    </PublicFormLoadingLayout>
  );
}
