const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireViewer } = require('../middleware/rbac');
const { supabase } = require('../config/supabase');

/**
 * Export tree data as JSON
 * GET /api/export/tree/:treeId/json
 */
router.get('/tree/:treeId/json', requireAuth, requireViewer, async (req, res) => {
    try {
        const { treeId } = req.params;

        // Fetch tree details
        const { data: tree, error: treeError } = await supabase
            .from('trees')
            .select('*')
            .eq('id', treeId)
            .single();

        if (treeError) throw treeError;

        // Fetch all persons in the tree
        const { data: persons, error: personsError } = await supabase
            .from('persons')
            .select('*')
            .eq('tree_id', treeId);

        if (personsError) throw personsError;

        // Fetch all relationships
        const { data: relationships, error: relsError } = await supabase
            .from('relationships')
            .select('*')
            .eq('tree_id', treeId);

        if (relsError) throw relsError;

        // Fetch all photos
        const { data: photos, error: photosError } = await supabase
            .from('photos')
            .select('*')
            .in('person_id', persons.map(p => p.id));

        if (photosError) throw photosError;

        // Build export object
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                version: '1.0',
                application: 'Family Tree App'
            },
            tree: {
                id: tree.id,
                name: tree.name,
                description: tree.description,
                created_at: tree.created_at
            },
            persons: persons.map(p => ({
                id: p.id,
                first_name: p.first_name,
                last_name: p.last_name,
                dob: p.dob,
                dod: p.dod,
                gender: p.gender,
                bio: p.bio,
                occupation: p.occupation,
                occupation_history: p.occupation_history,
                education: p.education,
                pob: p.pob,
                place_of_death: p.place_of_death,
                cause_of_death: p.cause_of_death,
                burial_place: p.burial_place,
                profile_photo_url: p.profile_photo_url
            })),
            relationships: relationships.map(r => ({
                id: r.id,
                person_1_id: r.person_1_id,
                person_2_id: r.person_2_id,
                type: r.type,
                status: r.status
            })),
            photos: photos.map(ph => ({
                id: ph.id,
                person_id: ph.person_id,
                url: ph.url,
                caption: ph.caption,
                date_taken: ph.date_taken,
                is_primary: ph.is_primary
            }))
        };

        // Set headers for download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${tree.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json"`);

        res.json(exportData);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export tree data' });
    }
});

/**
 * Export tree data as GEDCOM format
 * GET /api/export/tree/:treeId/gedcom
 */
router.get('/tree/:treeId/gedcom', requireAuth, requireViewer, async (req, res) => {
    try {
        const { treeId } = req.params;

        // Fetch tree details
        const { data: tree, error: treeError } = await supabase
            .from('trees')
            .select('*')
            .eq('id', treeId)
            .single();

        if (treeError) throw treeError;

        // Fetch all persons
        const { data: persons, error: personsError } = await supabase
            .from('persons')
            .select('*')
            .eq('tree_id', treeId);

        if (personsError) throw personsError;

        // Fetch all relationships
        const { data: relationships, error: relsError } = await supabase
            .from('relationships')
            .select('*')
            .eq('tree_id', treeId);

        if (relsError) throw relsError;

        // Build GEDCOM file
        let gedcom = '';

        // Header
        gedcom += '0 HEAD\n';
        gedcom += '1 SOUR Family Tree App\n';
        gedcom += '2 VERS 1.0\n';
        gedcom += '1 DATE ' + new Date().toISOString().split('T')[0].replace(/-/g, '') + '\n';
        gedcom += '1 CHAR UTF-8\n';
        gedcom += '1 GEDC\n';
        gedcom += '2 VERS 5.5.1\n';
        gedcom += '2 FORM LINEAGE-LINKED\n';

        // Individuals
        persons.forEach((person, index) => {
            const personId = `@I${index + 1}@`;
            gedcom += `0 ${personId} INDI\n`;
            gedcom += `1 NAME ${person.first_name || ''} /${person.last_name || ''}/\n`;

            if (person.first_name) gedcom += `2 GIVN ${person.first_name}\n`;
            if (person.last_name) gedcom += `2 SURN ${person.last_name}\n`;
            if (person.gender) gedcom += `1 SEX ${person.gender.charAt(0)}\n`;

            if (person.dob) {
                const dobParts = person.dob.split('-');
                gedcom += `1 BIRT\n`;
                gedcom += `2 DATE ${dobParts[2]} ${getMonthName(dobParts[1])} ${dobParts[0]}\n`;
                if (person.pob) gedcom += `2 PLAC ${person.pob}\n`;
            }

            if (person.dod) {
                const dodParts = person.dod.split('-');
                gedcom += `1 DEAT\n`;
                gedcom += `2 DATE ${dodParts[2]} ${getMonthName(dodParts[1])} ${dodParts[0]}\n`;
                if (person.place_of_death) gedcom += `2 PLAC ${person.place_of_death}\n`;
                if (person.cause_of_death) gedcom += `2 CAUS ${person.cause_of_death}\n`;
            }

            if (person.burial_place) {
                gedcom += `1 BURI\n`;
                gedcom += `2 PLAC ${person.burial_place}\n`;
            }

            if (person.occupation) gedcom += `1 OCCU ${person.occupation}\n`;
            if (person.bio) gedcom += `1 NOTE ${person.bio}\n`;
        });

        // Families (relationships)
        const families = {};
        let familyIndex = 1;

        relationships.forEach(rel => {
            if (rel.type === 'spouse') {
                const familyId = `@F${familyIndex++}@`;
                const person1Index = persons.findIndex(p => p.id === rel.person_1_id) + 1;
                const person2Index = persons.findIndex(p => p.id === rel.person_2_id) + 1;

                gedcom += `0 ${familyId} FAM\n`;
                gedcom += `1 HUSB @I${person1Index}@\n`;
                gedcom += `1 WIFE @I${person2Index}@\n`;

                families[rel.person_1_id] = families[rel.person_1_id] || [];
                families[rel.person_1_id].push(familyId);
                families[rel.person_2_id] = families[rel.person_2_id] || [];
                families[rel.person_2_id].push(familyId);
            }
        });

        // Trailer
        gedcom += '0 TRLR\n';

        // Set headers for download
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${tree.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.ged"`);

        res.send(gedcom);
    } catch (error) {
        console.error('GEDCOM export error:', error);
        res.status(500).json({ error: 'Failed to export GEDCOM data' });
    }
});

// Helper function to convert month number to name
function getMonthName(monthNum) {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return months[parseInt(monthNum) - 1] || '';
}

module.exports = router;
