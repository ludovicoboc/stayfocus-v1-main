BEGIN;

-- Create RPC: random_competition_questions
-- Returns N random questions for a competition, optionally filtered by difficulties
-- Enforces that the caller can only access their own competition's questions
CREATE OR REPLACE FUNCTION public.random_competition_questions(
  competition_id uuid,
  n int,
  difficulties text[] DEFAULT NULL
)
RETURNS SETOF public.competition_questions
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.*
  FROM public.competition_questions q
  JOIN public.competitions c ON c.id = q.competition_id
  WHERE q.competition_id = random_competition_questions.competition_id
    AND c.user_id = auth.uid()
    AND (
      difficulties IS NULL
      OR q.difficulty = ANY(difficulties)
    )
  ORDER BY random()
  LIMIT n;
$$;

-- Ensure only authenticated users can execute
REVOKE ALL ON FUNCTION public.random_competition_questions(uuid, int, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.random_competition_questions(uuid, int, text[]) TO authenticated;

COMMIT;
