"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Mail, LogOut, UserCircle, PanelLeft } from "lucide-react";
import Link from "next/link";
import { useSidebar } from "@/components/ui/sidebar"; // Import useSidebar

export function Header() {
  const { user, username, logoutUser, loading } = useAuth();
  const { toggleSidebar, isMobile } = useSidebar(); // Get toggleSidebar and isMobile

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        {isMobile && ( // Show trigger only on mobile, or always if you prefer
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 lg:hidden" // Hide on large screens if sidebar is always visible there
            onClick={toggleSidebar}
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        )}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Mail className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline text-xl sm:inline-block">
            XPMail
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {user && (
            <>
              <div className="flex items-center space-x-2">
                <UserCircle className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-foreground hidden sm:inline">
                  {username || user.email}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={logoutUser} disabled={loading}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
