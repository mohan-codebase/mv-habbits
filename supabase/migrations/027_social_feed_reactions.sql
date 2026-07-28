-- 027_social_feed_reactions.sql

-- Create feed_reactions table (Cheers)
CREATE TABLE IF NOT EXISTS public.feed_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES public.habit_entries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entry_id, user_id)
);

-- Create feed_comments table
CREATE TABLE IF NOT EXISTS public.feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES public.habit_entries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

-- Reactions RLS
CREATE POLICY "Users can view reactions on visible entries"
    ON public.feed_reactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.habit_entries he
            JOIN public.habits h ON he.habit_id = h.id
            WHERE he.id = feed_reactions.entry_id AND (
                h.user_id = auth.uid() OR
                h.visibility = 'public' OR
                (h.visibility = 'friends' AND EXISTS (
                    SELECT 1 FROM public.friends f WHERE f.status = 'accepted' AND (
                        (f.requester_id = auth.uid() AND f.addressee_id = h.user_id) OR
                        (f.addressee_id = auth.uid() AND f.requester_id = h.user_id)
                    )
                )) OR
                (h.visibility = 'family' AND EXISTS (
                    SELECT 1 FROM public.family_members fm1
                    JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
                    WHERE fm1.user_id = auth.uid() AND fm2.user_id = h.user_id
                ))
            )
        )
    );

CREATE POLICY "Users can insert their own reactions"
    ON public.feed_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
    ON public.feed_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- Comments RLS
CREATE POLICY "Users can view comments on visible entries"
    ON public.feed_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.habit_entries he
            JOIN public.habits h ON he.habit_id = h.id
            WHERE he.id = feed_comments.entry_id AND (
                h.user_id = auth.uid() OR
                h.visibility = 'public' OR
                (h.visibility = 'friends' AND EXISTS (
                    SELECT 1 FROM public.friends f WHERE f.status = 'accepted' AND (
                        (f.requester_id = auth.uid() AND f.addressee_id = h.user_id) OR
                        (f.addressee_id = auth.uid() AND f.requester_id = h.user_id)
                    )
                )) OR
                (h.visibility = 'family' AND EXISTS (
                    SELECT 1 FROM public.family_members fm1
                    JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
                    WHERE fm1.user_id = auth.uid() AND fm2.user_id = h.user_id
                ))
            )
        )
    );

CREATE POLICY "Users can insert their own comments"
    ON public.feed_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
    ON public.feed_comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON public.feed_comments FOR DELETE
    USING (auth.uid() = user_id);

-- Fix habit_entries RLS so friends can view them
DROP POLICY IF EXISTS "entries_select" ON public.habit_entries;

CREATE POLICY "entries_select" ON public.habit_entries FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.habits h
            WHERE h.id = habit_entries.habit_id AND (
                h.visibility = 'public' OR
                (h.visibility = 'friends' AND EXISTS (
                    SELECT 1 FROM public.friends f WHERE f.status = 'accepted' AND (
                        (f.requester_id = auth.uid() AND f.addressee_id = h.user_id) OR
                        (f.addressee_id = auth.uid() AND f.requester_id = h.user_id)
                    )
                )) OR
                (h.visibility = 'family' AND EXISTS (
                    SELECT 1 FROM public.family_members fm1
                    JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
                    WHERE fm1.user_id = auth.uid() AND fm2.user_id = h.user_id
                ))
            )
        )
    );
