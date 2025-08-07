-- Enable RLS on Downvote table
ALTER TABLE "public"."Downvote" ENABLE ROW LEVEL SECURITY;

-- Downvote table policies
CREATE POLICY "Anyone can view downvotes" ON "public"."Downvote"
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create downvotes" ON "public"."Downvote"
    FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own downvotes" ON "public"."Downvote"
    FOR DELETE USING (auth.uid()::text = "userId");
