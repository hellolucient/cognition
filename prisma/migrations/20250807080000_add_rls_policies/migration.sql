-- Enable Row Level Security on all tables
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Thread" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Upvote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."InviteCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."WaitlistEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PendingShare" ENABLE ROW LEVEL SECURITY;

-- User table policies
-- Users can only read/write their own data
CREATE POLICY "Users can view own profile" ON "public"."User"
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON "public"."User"
    FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile" ON "public"."User"
    FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Thread table policies
-- Public read access, authenticated users can create, authors can edit/delete
CREATE POLICY "Anyone can view threads" ON "public"."Thread"
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create threads" ON "public"."Thread"
    FOR INSERT WITH CHECK (auth.uid()::text = "authorId");

CREATE POLICY "Authors can update own threads" ON "public"."Thread"
    FOR UPDATE USING (auth.uid()::text = "authorId");

CREATE POLICY "Authors can delete own threads" ON "public"."Thread"
    FOR DELETE USING (auth.uid()::text = "authorId");

-- Comment table policies
-- Public read access, authenticated users can create, authors can edit/delete
CREATE POLICY "Anyone can view comments" ON "public"."Comment"
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON "public"."Comment"
    FOR INSERT WITH CHECK (auth.uid()::text = "authorId");

CREATE POLICY "Authors can update own comments" ON "public"."Comment"
    FOR UPDATE USING (auth.uid()::text = "authorId");

CREATE POLICY "Authors can delete own comments" ON "public"."Comment"
    FOR DELETE USING (auth.uid()::text = "authorId");

-- Upvote table policies
-- Authenticated users can create/delete their own upvotes
CREATE POLICY "Anyone can view upvotes" ON "public"."Upvote"
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create upvotes" ON "public"."Upvote"
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own upvotes" ON "public"."Upvote"
    FOR DELETE USING (auth.uid()::text = "userId");

-- InviteCode table policies
-- Users can only see their own created codes and used codes
CREATE POLICY "Users can view own created invite codes" ON "public"."InviteCode"
    FOR SELECT USING (auth.uid()::text = "createdById");

CREATE POLICY "Users can view invite codes they used" ON "public"."InviteCode"
    FOR SELECT USING (auth.uid()::text = "usedById");

CREATE POLICY "Authenticated users can create invite codes" ON "public"."InviteCode"
    FOR INSERT WITH CHECK (auth.uid()::text = "createdById");

CREATE POLICY "Users can update own invite codes" ON "public"."InviteCode"
    FOR UPDATE USING (auth.uid()::text = "createdById");

-- WaitlistEntry table policies
-- Public create access, admin read access (no admin role yet, so public read for now)
CREATE POLICY "Anyone can create waitlist entries" ON "public"."WaitlistEntry"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view waitlist entries" ON "public"."WaitlistEntry"
    FOR SELECT USING (true);

-- PendingShare table policies
-- Users can only see their own pending shares
CREATE POLICY "Users can view own pending shares" ON "public"."PendingShare"
    FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Authenticated users can create pending shares" ON "public"."PendingShare"
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own pending shares" ON "public"."PendingShare"
    FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own pending shares" ON "public"."PendingShare"
    FOR DELETE USING (auth.uid()::text = "userId");
