-- 025_social_connections.sql

-- Create friends table
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

-- Enable RLS for friends
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Friends policies
-- A user can see their friend connections (sent or received)
CREATE POLICY "Users can view their own friend connections"
    ON public.friends FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- A user can insert a friend request
CREATE POLICY "Users can create friend requests"
    ON public.friends FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

-- Users can update the status (e.g., accepting a request they received, or blocking)
CREATE POLICY "Users can update their friend connections"
    ON public.friends FOR UPDATE
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can delete/cancel their requests or remove friends
CREATE POLICY "Users can delete their friend connections"
    ON public.friends FOR DELETE
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);


-- Create families table
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for families
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Families policies
-- A user can see a family if they are the owner or a member
CREATE POLICY "Users can view families they belong to"
    ON public.families FOR SELECT
    USING (
        auth.uid() = owner_id OR 
        EXISTS (
            SELECT 1 FROM public.family_members fm 
            WHERE fm.family_id = id AND fm.user_id = auth.uid()
        )
    );

-- Any authenticated user can create a family (they become the owner)
CREATE POLICY "Users can create families"
    ON public.families FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Only the owner can update the family
CREATE POLICY "Owner can update family"
    ON public.families FOR UPDATE
    USING (auth.uid() = owner_id);

-- Only the owner can delete the family
CREATE POLICY "Owner can delete family"
    ON public.families FOR DELETE
    USING (auth.uid() = owner_id);


-- Create family_members table
CREATE TABLE IF NOT EXISTS public.family_members (
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (family_id, user_id)
);

-- Enable RLS for family_members
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Family members policies
-- A user can see all members of a family they belong to
CREATE POLICY "Users can view members of their families"
    ON public.family_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members fm 
            WHERE fm.family_id = family_members.family_id AND fm.user_id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM public.families f
            WHERE f.id = family_members.family_id AND f.owner_id = auth.uid()
        )
    );

-- Family owner or admin can add members
CREATE POLICY "Owners and admins can add family members"
    ON public.family_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.families f
            WHERE f.id = family_id AND f.owner_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.family_id = family_id AND fm.user_id = auth.uid() AND fm.role = 'admin'
        )
    );

-- Family owner or admin can update roles
CREATE POLICY "Owners and admins can update family members"
    ON public.family_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.families f
            WHERE f.id = family_id AND f.owner_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.family_id = family_id AND fm.user_id = auth.uid() AND fm.role = 'admin'
        )
    );

-- Family owner, admin, or the user themselves can remove a member
CREATE POLICY "Owners, admins, or the user can delete family members"
    ON public.family_members FOR DELETE
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.families f
            WHERE f.id = family_id AND f.owner_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.family_id = family_id AND fm.user_id = auth.uid() AND fm.role = 'admin'
        )
    );

-- Create a helper function to get user profiles for friends/family
-- Assuming a profiles table or auth.users. 
-- Wait, let's check if there's a profiles table first or if we just query auth.users.
