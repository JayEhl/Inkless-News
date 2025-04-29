-- Add new columns to articles table
ALTER TABLE articles
ADD COLUMN is_truncated BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN author TEXT,
ADD COLUMN copyright TEXT; 