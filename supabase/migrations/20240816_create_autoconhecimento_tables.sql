-- Migration: Create Self Knowledge (Autoconhecimento) Tables
-- Description: Creates tables and policies for the self-knowledge functionality
-- Date: 2024-08-16

BEGIN;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum type for self knowledge categories
CREATE TYPE self_knowledge_category AS ENUM ('quem_sou', 'meus_porques', 'meus_padroes');

-- Create self_knowledge_notes table
-- This table stores all self-knowledge notes organized by categories
CREATE TABLE IF NOT EXISTS self_knowledge_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category self_knowledge_category NOT NULL,
    title TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 200),
    content TEXT NOT NULL CHECK (length(content) > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add table comment
COMMENT ON TABLE self_knowledge_notes IS 'Stores self-knowledge notes organized by categories: who I am, my whys, and my patterns';
COMMENT ON COLUMN self_knowledge_notes.category IS 'Category of the note: quem_sou (who I am), meus_porques (my whys), meus_padroes (my patterns)';
COMMENT ON COLUMN self_knowledge_notes.title IS 'Title of the self-knowledge note (max 200 characters)';
COMMENT ON COLUMN self_knowledge_notes.content IS 'Content of the self-knowledge note';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_self_knowledge_notes_user_id ON self_knowledge_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_self_knowledge_notes_category ON self_knowledge_notes(category);
CREATE INDEX IF NOT EXISTS idx_self_knowledge_notes_user_category ON self_knowledge_notes(user_id, category);
CREATE INDEX IF NOT EXISTS idx_self_knowledge_notes_updated_at ON self_knowledge_notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_self_knowledge_notes_created_at ON self_knowledge_notes(created_at DESC);

-- Create composite index for main query pattern (user_id + category + updated_at)
CREATE INDEX IF NOT EXISTS idx_self_knowledge_notes_main_query ON self_knowledge_notes(user_id, category, updated_at DESC);

-- Create text search index for title and content
CREATE INDEX IF NOT EXISTS idx_self_knowledge_notes_search ON self_knowledge_notes USING gin(to_tsvector('portuguese', title || ' ' || content));

-- Enable Row Level Security (RLS)
ALTER TABLE self_knowledge_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for SELECT: users can only see their own notes
CREATE POLICY "Users can view their own self knowledge notes" ON self_knowledge_notes
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for INSERT: users can only insert their own notes
CREATE POLICY "Users can insert their own self knowledge notes" ON self_knowledge_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: users can only update their own notes
CREATE POLICY "Users can update their own self knowledge notes" ON self_knowledge_notes
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE: users can only delete their own notes
CREATE POLICY "Users can delete their own self knowledge notes" ON self_knowledge_notes
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on UPDATE
CREATE TRIGGER update_self_knowledge_notes_updated_at
    BEFORE UPDATE ON self_knowledge_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON self_knowledge_notes TO authenticated;
GRANT USAGE ON SEQUENCE self_knowledge_notes_id_seq TO authenticated;

-- Create function for full-text search (optional enhancement)
CREATE OR REPLACE FUNCTION search_self_knowledge_notes(
    search_user_id UUID,
    search_category self_knowledge_category DEFAULT NULL,
    search_term TEXT DEFAULT NULL
)
RETURNS SETOF self_knowledge_notes AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM self_knowledge_notes
    WHERE user_id = search_user_id
        AND (search_category IS NULL OR category = search_category)
        AND (
            search_term IS NULL 
            OR search_term = '' 
            OR to_tsvector('portuguese', title || ' ' || content) @@ plainto_tsquery('portuguese', search_term)
            OR title ILIKE '%' || search_term || '%'
            OR content ILIKE '%' || search_term || '%'
        )
    ORDER BY updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the search function
GRANT EXECUTE ON FUNCTION search_self_knowledge_notes TO authenticated;

COMMIT;
