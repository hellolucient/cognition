import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SupabaseProvider from "@/components/providers/supabase-provider";
import SignInButton from "@/components/auth/sign-in-button";
import { AdminNavLink } from "@/components/admin/admin-nav-link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vanwinkle - AI Conversation Platform",
  description: "Share and discuss interesting AI conversations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SupabaseProvider>
          <div className="flex min-h-screen flex-col">
            <header className="border-b">
              <div className="container mx-auto flex h-16 items-center justify-between">
                <div className="flex items-center gap-6">
                  <a href="/">
                    <img src="/vanwinkle_logo.png" alt="Vanwinkle" className="h-8 w-auto" />
                  </a>
                  <nav className="hidden md:flex items-center gap-4 text-sm">
                    <a href="/submit" className="text-muted-foreground hover:text-foreground">Submit</a>
                    <a href="/settings" className="text-muted-foreground hover:text-foreground">Settings</a>
                    <AdminNavLink />
                  </nav>
                </div>
                <SignInButton />
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
        </SupabaseProvider>
      </body>
    </html>
  );
}