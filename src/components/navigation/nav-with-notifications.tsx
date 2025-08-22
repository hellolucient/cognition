'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useSupabase } from '@/components/providers/supabase-provider';
import { AdminNavLink } from '@/components/admin/admin-nav-link';
import { NotificationBell } from '@/components/ui/notification-bell';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// Create a context to share pending count between desktop and mobile nav
const PendingCountContext = createContext<{
  pendingCount: number;
  fetchPendingCount: () => Promise<void>;
}>({
  pendingCount: 0,
  fetchPendingCount: async () => {},
});

// Provider component that handles the polling logic once
export function PendingCountProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSupabase();
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = async () => {
    // Only fetch if user is authenticated
    if (!user) {
      setPendingCount(0);
      return;
    }

    try {
      const response = await fetch('/api/pending-shares/count');
      if (!response.ok) {
        // If 401, user is not authenticated - don't spam logs
        if (response.status === 401) {
          setPendingCount(0);
          return;
        }
        console.warn('Failed to fetch pending count:', response.status, response.statusText);
        setPendingCount(0);
        return;
      }
      const data = await response.json();
      const value = Number(data?.pending);
      setPendingCount(Number.isFinite(value) && value > 0 ? value : 0);
    } catch (err) {
      console.error('Error fetching pending count:', err);
      setPendingCount(0);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPendingCount();
      // Refresh count every 30 seconds, but only if user is authenticated
      const interval = setInterval(() => {
        if (user) {
          fetchPendingCount();
        }
      }, 30000);
      return () => clearInterval(interval);
    } else {
      setPendingCount(0);
    }
  }, [user]);

  return (
    <PendingCountContext.Provider value={{ pendingCount, fetchPendingCount }}>
      {children}
    </PendingCountContext.Provider>
  );
}

// Hook to use the pending count
const usePendingCount = () => {
  const context = useContext(PendingCountContext);
  if (!context) {
    // Fallback if context is not available
    return { pendingCount: 0, fetchPendingCount: async () => {} };
  }
  return context;
};

export function NavWithNotifications() {
  const { user } = useSupabase();
  const { pendingCount } = usePendingCount();

  return (
    <nav className="hidden md:flex items-center gap-4 text-sm">
      {user && (
        <Link href={`/profile/${user.id}`} className="text-muted-foreground hover:text-foreground">
          Profile
        </Link>
      )}
      <Link href="/test-inline-comments" className="text-muted-foreground hover:text-foreground">
        Test Inline Comments
      </Link>
      <Link href="/settings" className="text-muted-foreground hover:text-foreground relative">
        Settings
        {user && pendingCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
          >
            {pendingCount > 99 ? '99+' : pendingCount}
          </Badge>
        )}
      </Link>
      <NotificationBell />
      <AdminNavLink />
    </nav>
  );
}

// Mobile navigation component
export function MobileNavWithNotifications() {
  const { user } = useSupabase();
  const { pendingCount } = usePendingCount();

  return (
    <nav className="md:hidden flex items-center gap-4 text-sm">
      {user && (
        <Link href={`/profile/${user.id}`} className="text-muted-foreground hover:text-foreground">
          Profile
        </Link>
      )}
      <Link href="/test-inline-comments" className="text-muted-foreground hover:text-foreground">
        Test Inline Comments
      </Link>
      <Link href="/settings" className="text-muted-foreground hover:text-foreground relative">
        Settings
        {user && pendingCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center text-xs p-0 min-w-[16px]"
          >
            {pendingCount > 9 ? '9+' : pendingCount}
          </Badge>
        )}
      </Link>
      <NotificationBell />
      {/* Show Admin link on mobile when authorized */}
      <AdminNavLink />
    </nav>
  );
}