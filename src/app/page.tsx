
"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, User, LayoutDashboard, Edit3, UploadCloud, AlertCircle, BarChart3, CheckSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Added import
import { useToast } from "@/hooks/use-toast";
import { uploadToImgBB } from "@/services/imageService";
import { getFormsByUser, getTotalSubmissionsForUser } from "@/services/formService"; // Import new service functions

// ImgBB API Key - WARNING: DO NOT EXPOSE IN PRODUCTION CLIENT-SIDE CODE
// Move this to a secure backend (e.g., Firebase Cloud Function) for production.
const IMG_BB_API_KEY = "2bb2346a6a907388d8a3b0beac2bca86";


export default function DashboardPage() {
  const { user, username, loading: authLoading, updateUserProfilePhoto } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [profileImageError, setProfileImageError] = useState<string | null>(null);

  const [totalFormsCount, setTotalFormsCount] = useState<number | null>(null);
  const [totalSubmissionsCount, setTotalSubmissionsCount] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);


  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchDashboardStats();
    }
  }, [user, authLoading, router]);

  const fetchDashboardStats = async () => {
    if (!user) return;
    setStatsLoading(true);
    try {
      const forms = await getFormsByUser(user.uid);
      setTotalFormsCount(forms.length);
      
      const submissions = await getTotalSubmissionsForUser(user.uid);
      setTotalSubmissionsCount(submissions);

    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      toast({
        title: "Error Fetching Stats",
        description: (error as Error).message || "Could not load dashboard statistics.",
        variant: "destructive",
      });
      setTotalFormsCount(0); // Fallback
      setTotalSubmissionsCount(0); // Fallback
    } finally {
      setStatsLoading(false);
    }
  };


  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const handleProfileImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setProfileImageFile(event.target.files[0]);
      setProfileImageError(null);
    }
  };

  const handleProfileImageUpload = async () => {
    if (!profileImageFile) {
      setProfileImageError("Please select an image file first.");
      return;
    }
    if (!user) {
      setProfileImageError("You must be logged in to upload a profile picture.");
      return;
    }

    setIsUploadingProfileImage(true);
    setProfileImageError(null);

    try {
      const imageUrl = await uploadToImgBB(IMG_BB_API_KEY, profileImageFile);
      await updateUserProfilePhoto(imageUrl);
      toast({
        title: "Profile Picture Updated!",
        description: "Your new profile picture has been saved.",
      });
      setProfileImageFile(null); 
    } catch (error) {
      console.error("Profile image upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setProfileImageError(`Upload failed: ${errorMessage}`);
      toast({
        title: "Upload Failed",
        description: `Could not update profile picture: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsUploadingProfileImage(false);
    }
  };


  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size={48} />
      </div>
    );
  }
  
  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card - Spans full width on small, 1/3 on large */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg h-full">
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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-image-upload" className="text-sm font-medium">Update Profile Picture</Label>
                <Input 
                  id="profile-image-upload" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleProfileImageSelect}
                  className="text-sm" 
                />
                {profileImageFile && <p className="text-xs text-muted-foreground">Selected: {profileImageFile.name}</p>}
              </div>

              {profileImageError && (
                <p className="text-sm text-destructive flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1 shrink-0" /> {profileImageError}
                </p>
              )}

              <Button 
                onClick={handleProfileImageUpload} 
                disabled={!profileImageFile || isUploadingProfileImage}
                className="w-full"
              >
                {isUploadingProfileImage ? <Spinner className="mr-2" size={16} /> : <UploadCloud className="mr-2 h-4 w-4" />}
                {isUploadingProfileImage ? "Uploading..." : "Upload Picture"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Images uploaded via ImgBB. Review their terms.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Content & Stats - Spans full width on small, 2/3 on large */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline flex items-center">
                <LayoutDashboard className="w-6 h-6 mr-3 text-primary" /> Welcome to Your Dashboard
              </CardTitle>
              <CardDescription>Manage your account, forms, and other application features.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                  This is your central hub. Use the sidebar to navigate to different sections of the application.
                </p>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Spinner size={24} />
                ) : (
                  <div className="text-2xl font-bold">{totalFormsCount ?? '0'}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  Number of forms you've created.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <CheckSquare className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 {statsLoading ? (
                  <Spinner size={24} />
                ) : (
                  <div className="text-2xl font-bold">{totalSubmissionsCount ?? '0'}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  Across all your active forms.
                </p>
              </CardContent>
            </Card>
          </div>
           
           <div className="text-center py-8 bg-muted/50 rounded-md mt-8">
                <Edit3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Get Started</h3>
                 <p className="text-muted-foreground px-4">
                    Explore your forms, create new ones, or check your account settings using the sidebar.
                </p>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
