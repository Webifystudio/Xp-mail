import type { ReactNode } from 'react';
import { Header } from './Header';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { LayoutDashboard, PlusSquare, FileText, Settings, LifeBuoy } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen flex-col">
        <Sidebar side="left" collapsible="icon" className="hidden md:flex">
          <SidebarHeader className="p-4 justify-center">
             {/* Placeholder for logo or app name in sidebar header if needed */}
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{children: "Dashboard", side: "right", align:"center"}}>
                  <Link href="/">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{children: "Create Form", side: "right", align:"center"}}>
                  <Link href="/forms/create">
                    <PlusSquare />
                    <span>Create Form</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Example for a future forms list page */}
              {/* <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{children: "My Forms", side: "right", align:"center"}}>
                  <Link href="/forms">
                    <FileText />
                    <span>My Forms</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem> */}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{children: "Support", side: "right", align:"center"}}>
                  <Link href="#">
                    <LifeBuoy />
                    <span>Support</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{children: "Settings", side: "right", align:"center"}}>
                  <Link href="#">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main content area */}
        <SidebarInset className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 container mx-auto py-8 px-4">
            {children}
          </main>
          <footer className="py-6 md:px-8 md:py-0 border-t">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
              <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                © {new Date().getFullYear()} XPMail & Forms. All rights reserved.
              </p>
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
