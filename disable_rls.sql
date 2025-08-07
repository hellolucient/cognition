-- Disable RLS on all tables to restore functionality
-- Run this in your Supabase SQL editor

-- Disable RLS on all tables
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Thread" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Upvote" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "InviteCode" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "WaitlistEntry" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "PendingShare" DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean slate
DROP POLICY IF EXISTS "Users can read own data" ON "User";
DROP POLICY IF EXISTS "Users can update own data" ON "User";
DROP POLICY IF EXISTS "Allow user creation" ON "User";

DROP POLICY IF EXISTS "Threads are publicly readable" ON "Thread";
DROP POLICY IF EXISTS "Authenticated users can create threads" ON "Thread";
DROP POLICY IF EXISTS "Users can update own threads" ON "Thread";
DROP POLICY IF EXISTS "Users can delete own threads" ON "Thread";

DROP POLICY IF EXISTS "Comments are publicly readable" ON "Comment";
DROP POLICY IF EXISTS "Authenticated users can create comments" ON "Comment";
DROP POLICY IF EXISTS "Users can update own comments" ON "Comment";
DROP POLICY IF EXISTS "Users can delete own comments" ON "Comment";

DROP POLICY IF EXISTS "Upvotes are publicly readable" ON "Upvote";
DROP POLICY IF EXISTS "Authenticated users can create upvotes" ON "Upvote";
DROP POLICY IF EXISTS "Users can delete own upvotes" ON "Upvote";

DROP POLICY IF EXISTS "Users can read own invite codes" ON "InviteCode";
DROP POLICY IF EXISTS "Users can create invite codes" ON "InviteCode";
DROP POLICY IF EXISTS "Users can update own invite codes" ON "InviteCode";

DROP POLICY IF EXISTS "Anyone can read waitlist entries" ON "WaitlistEntry";
DROP POLICY IF EXISTS "Anyone can create waitlist entries" ON "WaitlistEntry";

DROP POLICY IF EXISTS "Users can read own pending shares" ON "PendingShare";
DROP POLICY IF EXISTS "Users can create pending shares" ON "PendingShare";
DROP POLICY IF EXISTS "Users can update own pending shares" ON "PendingShare";
DROP POLICY IF EXISTS "Users can delete own pending shares" ON "PendingShare";

-- Confirm RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('User', 'Thread', 'Comment', 'Upvote', 'InviteCode', 'WaitlistEntry', 'PendingShare');
