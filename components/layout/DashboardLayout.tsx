"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { NotificationToast } from "@/components/ui/NotificationToast";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: "student" | "expert" | "admin";
  userName?: string;
  userEmail?: string;
  pageTitle?: string;
}

export function DashboardLayout({
  children,
  role = "student",
  userName = "Student",
  userEmail = "",
  pageTitle,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      {/* Real-time notification toasts */}
      <NotificationToast />
      
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col flex-shrink-0">
        <Sidebar role={role} userName={userName} userEmail={userEmail} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 z-50">
            <Sidebar role={role} userName={userName} userEmail={userEmail} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-border dark:border-slate-700 flex items-center px-4 sm:px-6 gap-4 flex-shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-text-secondary dark:text-slate-300 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </button>

          {pageTitle && (
            <h1 className="text-base font-semibold text-text-primary hidden sm:block">
              {pageTitle}
            </h1>
          )}

          <div className="flex-1 max-w-xs hidden sm:block">
            <div className="relative">
              <Search className="size-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                placeholder="Search..."
                className="w-full h-9 pl-9 pr-4 text-sm bg-canvas border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <div className="size-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-semibold">
              {userName[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
