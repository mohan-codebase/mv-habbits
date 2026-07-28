-- 026_data_visibility.sql

-- Add visibility column to habits
ALTER TABLE public.habits
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'friends', 'family', 'public'));

-- Add visibility column to goals
ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'friends', 'family', 'public'));

-- Update RLS policies for habits
DROP POLICY IF EXISTS "Users can view their own habits" ON public.habits;
CREATE POLICY "Users can view habits based on visibility"
    ON public.habits FOR SELECT
    USING (
        auth.uid() = user_id OR
        visibility = 'public' OR
        (visibility = 'friends' AND EXISTS (
            SELECT 1 FROM public.friends f
            WHERE f.status = 'accepted' AND (
                (f.requester_id = auth.uid() AND f.addressee_id = habits.user_id) OR
                (f.addressee_id = auth.uid() AND f.requester_id = habits.user_id)
            )
        )) OR
        (visibility = 'family' AND EXISTS (
            SELECT 1 FROM public.family_members fm1
            JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
            WHERE fm1.user_id = auth.uid() AND fm2.user_id = habits.user_id
        ))
    );

-- Users should still only be able to update/delete their own habits
CREATE POLICY "Users can insert their own habits"
    ON public.habits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
    ON public.habits FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
    ON public.habits FOR DELETE
    USING (auth.uid() = user_id);


-- Update RLS policies for goals
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;
CREATE POLICY "Users can view goals based on visibility"
    ON public.goals FOR SELECT
    USING (
        auth.uid() = user_id OR
        visibility = 'public' OR
        (visibility = 'friends' AND EXISTS (
            SELECT 1 FROM public.friends f
            WHERE f.status = 'accepted' AND (
                (f.requester_id = auth.uid() AND f.addressee_id = goals.user_id) OR
                (f.addressee_id = auth.uid() AND f.requester_id = goals.user_id)
            )
        )) OR
        (visibility = 'family' AND EXISTS (
            SELECT 1 FROM public.family_members fm1
            JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
            WHERE fm1.user_id = auth.uid() AND fm2.user_id = goals.user_id
        ))
    );

CREATE POLICY "Users can insert their own goals"
    ON public.goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
    ON public.goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
    ON public.goals FOR DELETE
    USING (auth.uid() = user_id);
