-- Get Full Demo Tree Data
-- This script creates a function to export an entire tree's data as a single JSON object
-- Usage: SELECT get_tree_full_export('Demo Family Tree');

CREATE OR REPLACE FUNCTION get_tree_full_export(tree_name_param TEXT)
RETURNS JSONB AS $$
DECLARE
    target_tree_id UUID;
    result JSONB;
BEGIN
    -- Find the tree ID
    SELECT id INTO target_tree_id
    FROM trees
    WHERE name = tree_name_param
    LIMIT 1;

    IF target_tree_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Tree not found');
    END IF;

    SELECT jsonb_build_object(
        'tree', (SELECT row_to_json(t) FROM trees t WHERE id = target_tree_id),
        
        'members', (
            SELECT jsonb_agg(row_to_json(tm))
            FROM tree_members tm
            WHERE tm.tree_id = target_tree_id
        ),

        'persons', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'details', row_to_json(p),
                    'life_events', (
                        SELECT jsonb_agg(row_to_json(le))
                        FROM life_events le
                        WHERE le.person_id = p.id
                    ),
                    'media', (
                        SELECT jsonb_agg(row_to_json(m))
                        FROM media m
                        WHERE m.person_id = p.id
                    ),
                    'documents', (
                        SELECT jsonb_agg(row_to_json(d))
                        FROM documents d
                        WHERE d.person_id = p.id
                    )
                )
            )
            FROM persons p
            WHERE p.tree_id = target_tree_id
        ),

        'relationships', (
            SELECT jsonb_agg(row_to_json(r))
            FROM relationships r
            WHERE r.tree_id = target_tree_id
        ),

        'stories', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'details', row_to_json(s),
                    'tagged_people', (
                        SELECT jsonb_agg(row_to_json(sp))
                        FROM story_people sp
                        WHERE sp.story_id = s.id
                    )
                )
            )
            FROM stories s
            WHERE s.tree_id = target_tree_id
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT jsonb_pretty(get_tree_full_export('Demo Family Tree'));
