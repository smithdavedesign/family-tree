-- Migration: Add updated_at to trees table
-- Date: 2025-12-22

ALTER TABLE trees 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
