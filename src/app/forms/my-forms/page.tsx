
"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from 'date-fns';
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, FilePlus2, AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { getFormsByUser, deleteForm, FormSchemaWithId } from "@/services/formService";
import type { Timestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";


export default function MyFormsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [forms, setForms] = useState<FormSchemaWithId[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchForms();
    }
  }, [user, authLoading, router]);

  const fetchForms = async () => {
    if (!user) return;
    setIsLoadingForms(true);
    setError(null);
    try {
      const userForms = await getFormsByUser(user.uid);
      setForms(userForms);
    } catch (e) {
      console.error("Client-side error during fetchForms:", e);
      const errorMessage = (e instanceof Error) ? e.message : "An unknown error occurred while fetching forms.";
      // The service function getFormsByUser throws 'Failed to fetch forms.'
      // The actual Firestore error is logged server-side.
      setError(errorMessage + " This often indicates a missing Firestore index. Please check your server console logs (where 'npm run dev' is running) for a detailed error message from Firestore, which may include a link to create the required index.");
      toast({ 
        title: "Error Fetching Forms", 
        description: errorMessage + " Check server logs for details.", 
        variant: "destructive",
        duration: 10000 // Show longer
      });
    } finally {
      setIsLoadingForms(false);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!user) return;
    try {
      await deleteForm(formId, user.uid);
      toast({ title: "Form Deleted", description: "The form has been successfully deleted." });
      fetchForms(); // Refresh the list
    } catch (e) {
      console.error("Failed to delete form:", e);
      const errorMessage = (e instanceof Error) ? e.message : "Could not delete the form.";
      toast({ title: "Error Deleting Form", description: errorMessage, variant: "destructive" });
    }
  };

  const formatDate = (timestamp: Timestamp | string) => {
    if (typeof timestamp === 'string') {
      // If it's already a string, assume it's pre-formatted or an ISO string
      try {
        return format(new Date(timestamp), 'PPpp');
      } catch {
        return timestamp; // Fallback to original string if parsing fails
      }
    }
    if (timestamp && typeof timestamp.toDate === 'function') {
      return format(timestamp.toDate(), 'PPpp'); // PPpp for full date and time
    }
    return 'N/A';
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <AppLayout>
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
          <Spinner size={48} />
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-headline">My Forms</CardTitle>
            <CardDescription>View, manage, and analyze your created forms.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/forms/create">
              <FilePlus2 className="mr-2 h-5 w-5" /> Create New Form
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingForms && (
            <div className="flex justify-center items-center py-10">
              <Spinner size={32} /> 
              <p className="ml-2 text-muted-foreground">Loading your forms...</p>
            </div>
          )}
          {!isLoadingForms && error && (
             <div className="flex flex-col items-center justify-center py-10 bg-destructive/10 border border-destructive text-destructive rounded-md p-4">
              <AlertTriangle className="w-12 h-12 mb-2" />
              <p className="text-lg font-semibold">Error Loading Forms</p>
              <p className="text-sm text-center">{error}</p>
              <Button variant="outline" onClick={fetchForms} className="mt-4">Try Again</Button>
            </div>
          )}
          {!isLoadingForms && !error && forms.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
              <FilePlus2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground">No Forms Yet</h3>
              <p className="text-muted-foreground mb-4">You haven't created any forms. Get started by creating one!</p>
              <Button asChild>
                <Link href="/forms/create">Create Your First Form</Link>
              </Button>
            </div>
          )}
          {!isLoadingForms && !error && forms.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell className="font-medium">{form.title}</TableCell>
                      <TableCell>{formatDate(form.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu for {form.title}</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/form/${form.id}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="mr-2 h-4 w-4" /> View Public Form
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              {/* Link to a future edit page */}
                              <Link href={`/forms/edit/${form.id}`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Form
                              </Link>
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete Form
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the form
                                    "{form.title}" and all its associated data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteForm(form.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
