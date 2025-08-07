import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SupabaseProvider from "@/components/providers/supabase-provider";
import SignInButton from "@/components/auth/sign-in-button";
import { NavWithNotifications, MobileNavWithNotifications } from "@/components/navigation/nav-with-notifications";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "vanwinkle - AI Conversation Platform",
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
              <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2 md:gap-6 min-w-0">
                  <Link href="/" className="flex-shrink-0">
                    <img src="/vanwinkle_logo.png" alt="vanwinkle" className="h-6 md:h-8 w-auto" />
                  </Link>
                  <NavWithNotifications />
                  <MobileNavWithNotifications />
                </div>
                <div className="flex-shrink-0">
                  <SignInButton />
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
        </SupabaseProvider>
      </body>
    </html>
  );
}