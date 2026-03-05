CREATE TABLE IF NOT EXISTS anon_chat_feedback_votes (
  vote_id bigserial PRIMARY KEY,
  assistant_message_id uuid NOT NULL REFERENCES anon_chat_messages(message_id) ON DELETE CASCADE,
  voter_token text NOT NULL,
  vote text NOT NULL CHECK (vote IN ('like','dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assistant_message_id, voter_token)
);

CREATE INDEX IF NOT EXISTS idx_anon_chat_feedback_votes_token
  ON anon_chat_feedback_votes (voter_token);
