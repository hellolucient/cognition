-- Enable RLS on all tables (if not already enabled)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Thread" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Upvote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InviteCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WaitlistEntry" ENABLE ROW LEVEL SECURITY;

-- User table policies
CREATE POLICY "Users can read own data" ON "User" 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON "User"
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow user creation" ON "User"
FOR INSERT WITH CHECK (true);

-- Thread table policies
CREATE POLICY "Anyone can read threads" ON "Thread"
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create threads" ON "Thread"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own threads" ON "Thread"
FOR UPDATE USING (auth.uid() = "authorId");

-- InviteCode table policies
CREATE POLICY "Users can read own invite codes" ON "InviteCode"
FOR SELECT USING (auth.uid() = "createdById" OR auth.uid() = "usedById");

CREATE POLICY "Users can create invite codes" ON "InviteCode"
FOR INSERT WITH CHECK (auth.uid() = "createdById");

CREATE POLICY "Users can update own invite codes" ON "InviteCode"
FOR UPDATE USING (auth.uid() = "createdById");

CREATE POLICY "Anyone can validate invite codes" ON "InviteCode"
FOR SELECT USING (true);

-- WaitlistEntry table policies
CREATE POLICY "Anyone can join waitlist" ON "WaitlistEntry"
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can read waitlist" ON "WaitlistEntry"
FOR SELECT USING (true);

-- Comment table policies (for future use)
CREATE POLICY "Anyone can read comments" ON "Comment"
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON "Comment"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own comments" ON "Comment"
FOR UPDATE USING (auth.uid() = "authorId");

-- Upvote table policies (for future use)
CREATE POLICY "Anyone can read upvotes" ON "Upvote"
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create upvotes" ON "Upvote"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete own upvotes" ON "Upvote"
FOR DELETE USING (auth.uid() = "userId");