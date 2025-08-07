'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/components/providers/supabase-provider';
import { AdminNavLink } from '@/components/admin/admin-nav-link';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function NavWithNotifications() {
  const { user } = useSupabase();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchPendingCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchPendingCount = async () => {
    try {
      const response = await fetch('/api/pending-shares/count');
      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.pending);
      }
    } catch (err) {
      console.error('Error fetching pending count:', err);
    }
  };

  return (
    <nav className="hidden md:flex items-center gap-4 text-sm">
      <Link href="/submit" className="text-muted-foreground hover:text-foreground">
        Submit
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
      <AdminNavLink />
    </nav>
  );
}

// Mobile navigation component
export function MobileNavWithNotifications() {
  const { user } = useSupabase();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchPendingCount = async () => {
    try {
      const response = await fetch('/api/pending-shares/count');
      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.pending);
      }
    } catch (err) {
      console.error('Error fetching pending count:', err);
    }
  };

  return (
    <nav className="md:hidden flex items-center gap-4 text-sm">
      <Link href="/submit" className="text-muted-foreground hover:text-foreground">
        Submit
      </Link>
      <Link href="/save-for-later" className="text-muted-foreground hover:text-foreground">
        💾
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
    </nav>
  );
}