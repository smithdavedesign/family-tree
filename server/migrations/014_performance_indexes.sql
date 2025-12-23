-- Migration 014: Add performance indexes
-- Improves query speed for large trees and media galleries

-- Persons table indexes
CREATE INDEX IF NOT EXISTS idx_persons_tree_id ON public.persons(tree_id);
CREATE INDEX IF NOT EXISTS idx_persons_last_name ON public.persons(last_name);

-- Relationships table indexes
CREATE INDEX IF NOT EXISTS idx_relationships_tree_id ON public.relationships(tree_id);
CREATE INDEX IF NOT EXISTS idx_relationships_person_1_id ON public.relationships(person_1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_person_2_id ON public.relationships(person_2_id);

-- Media table indexes (Legacy table)
CREATE INDEX IF NOT EXISTS idx_media_person_id ON public.media(person_id);

-- Invitations table indexes
CREATE INDEX IF NOT EXISTS idx_invitations_tree_id ON public.invitations(tree_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
