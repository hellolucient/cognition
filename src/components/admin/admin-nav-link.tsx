"use client";

import Link from "next/link";
import { useSupabase } from "@/components/providers/supabase-provider";

export function AdminNavLink() {
  const { user } = useSupabase();
  
  // Simple admin check
  const isAdmin = user?.email === 'trent.munday@gmail.com';
  
  if (!isAdmin) return null;
  
  return (
    <Link 
      href="/admin" 
      className="text-muted-foreground hover:text-foreground text-sm"
    >
      Admin
    </Link>
  );
}