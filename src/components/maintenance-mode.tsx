"use client";

import { useSupabase } from "@/components/providers/supabase-provider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

interface MaintenanceModeProps {
  children: React.ReactNode;
}

export function MaintenanceMode({ children }: MaintenanceModeProps) {
  const { user, loading } = useSupabase();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check if maintenance mode is enabled
    const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
    
    console.log('🔧 MaintenanceMode component - Maintenance mode:', maintenanceMode, 'Path:', pathname, 'User:', user?.email);
    
    if (!maintenanceMode) {
      // Maintenance mode is off, allow all requests
      return;
    }

    // Maintenance mode is on - check for allowed routes
    const allowedRoutes = [
      '/install',
      '/bookmarklet',
      '/api/auth',
      '/api/invite',
      '/api/waitlist',
      '/api/debug',
    ];

    // Check if the current path is allowed
    const isAllowedRoute = allowedRoutes.some(route => 
      pathname.startsWith(route)
    );

    console.log('🔧 Is allowed route:', isAllowedRoute, 'for path:', pathname);

    if (isAllowedRoute) {
      // Allow access to install page and auth routes
      return;
    }

    // Check if user is admin (your email)
    const isAdmin = user?.email === 'trent.munday@gmail.com';
    
    console.log('🔧 User:', user?.email, 'Is admin:', isAdmin);

    if (isAdmin) {
      // Admin can access everything
      console.log('🔧 Admin access granted');
      return;
    }

    // Redirect non-admin users to install page
    console.log('🔧 Redirecting to /install');
    router.push('/install');
  }, [user, pathname, router]);

  // Don't render children if we're redirecting
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
    const allowedRoutes = [
      '/install',
      '/bookmarklet',
      '/api/auth',
      '/api/invite',
      '/api/waitlist',
      '/api/debug',
    ];

    const isAllowedRoute = allowedRoutes.some(route => 
      pathname.startsWith(route)
    );

    const isAdmin = user?.email === 'trent.munday@gmail.com';

    if (!isAllowedRoute && !isAdmin && !loading) {
      // Show loading while redirecting
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Redirecting...</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
