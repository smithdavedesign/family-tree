const { supabaseAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

exports.getUpcomingEvents = async (req, res) => {
    // We'll look for events in the next 30 days
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    const currentMonth = today.getMonth() + 1; // 1-12
    const currentDay = today.getDate();
    const nextMonthMonth = nextMonth.getMonth() + 1;
    const nextMonthDay = nextMonth.getDate();

    try {
        // 1. Fetch Persons (Birthdays & Death Anniversaries)
        // We need to fetch all persons for trees the user has access to.
        // For simplicity/performance, we'll fetch basic info and filter in memory for now,
        // or we could use complex SQL. Given the likely scale, in-memory filtering of dates is fine for MVP.
        // Optimization: We could add generated columns for month/day to the DB for easier querying.

        // Get user's accessible trees
        const { data: memberships, error: memberError } = await supabaseAdmin
            .from('tree_members')
            .select('tree_id')
            .eq('user_id', req.user.id);

        if (memberError) throw memberError;

        const treeIds = memberships.map(m => m.tree_id);

        // Also get owned trees
        const { data: ownedTrees, error: ownerError } = await supabaseAdmin
            .from('trees')
            .select('id')
            .eq('owner_id', req.user.id);

        if (ownerError) throw ownerError;

        const allTreeIds = [...new Set([...treeIds, ...ownedTrees.map(t => t.id)])];

        if (allTreeIds.length === 0) {
            return res.json([]);
        }

        // Fetch persons
        const { data: persons, error: personsError } = await supabaseAdmin
            .from('persons')
            .select('id, first_name, last_name, dob, dod, profile_photo_url')
            .in('tree_id', allTreeIds);

        if (personsError) throw personsError;

        // Fetch relationships (Marriages)
        // Note: marriage_date column needs to be added via migration
        // Commenting out for now until schema is updated
        const relationships = [];
        /*
        const { data: relationships, error: relsError } = await supabaseAdmin
            .from('relationships')
            .select('id, person_1_id, person_2_id, marriage_date, type')
            .in('tree_id', allTreeIds)
            .eq('type', 'spouse')
            .not('marriage_date', 'is', null);

        if (relsError) throw relsError;
        */

        // Fetch life events
        // Note: life_events doesn't have tree_id directly, need to join or filter by person_ids
        // But we already have person IDs.
        const personIds = persons.map(p => p.id);
        const { data: lifeEvents, error: eventsError } = await supabaseAdmin
            .from('life_events')
            .select('id, person_id, title, date, event_type')
            .in('person_id', personIds)
            .not('date', 'is', null);

        if (eventsError) throw eventsError;

        // Process Events
        const upcomingEvents = [];

        const isUpcoming = (dateString) => {
            if (!dateString) return false;
            const date = new Date(dateString);
            const month = date.getMonth() + 1;
            const day = date.getDate();

            // Check if date is between today and nextMonth
            // Case 1: Same month (e.g. today is Jan 1, next is Jan 31)
            if (currentMonth === nextMonthMonth) {
                return month === currentMonth && day >= currentDay && day <= nextMonthDay;
            }
            // Case 2: Different months (e.g. today is Jan 20, next is Feb 19)
            else {
                if (month === currentMonth && day >= currentDay) return true;
                if (month === nextMonthMonth && day <= nextMonthDay) return true;
                return false;
            }
        };

        const getYears = (dateString) => {
            if (!dateString) return 0;
            const date = new Date(dateString);
            return today.getFullYear() - date.getFullYear();
        };

        // Birthdays
        persons.forEach(p => {
            if (isUpcoming(p.dob)) {
                upcomingEvents.push({
                    id: `dob-${p.id}`,
                    type: 'birthday',
                    title: `${p.first_name}'s Birthday`,
                    date: p.dob,
                    years: getYears(p.dob),
                    person: p,
                    sortDate: new Date(today.getFullYear(), new Date(p.dob).getMonth(), new Date(p.dob).getDate())
                });
            }
            if (isUpcoming(p.dod)) {
                upcomingEvents.push({
                    id: `dod-${p.id}`,
                    type: 'death_anniversary',
                    title: `${p.first_name}'s Death Anniversary`,
                    date: p.dod,
                    years: getYears(p.dod),
                    person: p,
                    sortDate: new Date(today.getFullYear(), new Date(p.dod).getMonth(), new Date(p.dod).getDate())
                });
            }
        });

        // Anniversaries
        relationships.forEach(r => {
            if (isUpcoming(r.marriage_date)) {
                const p1 = persons.find(p => p.id === r.person_1_id);
                const p2 = persons.find(p => p.id === r.person_2_id);
                if (p1 && p2) {
                    upcomingEvents.push({
                        id: `rel-${r.id}`,
                        type: 'anniversary',
                        title: `${p1.first_name} & ${p2.first_name}'s Anniversary`,
                        date: r.marriage_date,
                        years: getYears(r.marriage_date),
                        people: [p1, p2],
                        sortDate: new Date(today.getFullYear(), new Date(r.marriage_date).getMonth(), new Date(r.marriage_date).getDate())
                    });
                }
            }
        });

        // Life Events
        lifeEvents.forEach(e => {
            if (isUpcoming(e.date)) {
                const p = persons.find(p => p.id === e.person_id);
                if (p) {
                    upcomingEvents.push({
                        id: `event-${e.id}`,
                        type: 'life_event',
                        subtype: e.event_type,
                        title: `${p.first_name}: ${e.title}`,
                        date: e.date,
                        years: getYears(e.date),
                        person: p,
                        sortDate: new Date(today.getFullYear(), new Date(e.date).getMonth(), new Date(e.date).getDate())
                    });
                }
            }
        });

        // Sort by upcoming date
        upcomingEvents.sort((a, b) => a.sortDate - b.sortDate);

        res.json(upcomingEvents);

    } catch (error) {
        logger.error('Error fetching upcoming events:', error, req);
        res.status(500).json({ error: error.message });
    }
};
