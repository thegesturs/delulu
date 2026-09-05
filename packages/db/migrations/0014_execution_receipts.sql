-- Transaction witnesses only: no payload, deadline, status, or queue index.
-- Durable Objects remove their receipt after observing the commit.
CREATE TABLE IF NOT EXISTS execution_receipts (
  id uuid PRIMARY KEY
);
