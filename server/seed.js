const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('🌱 Starting seed process...');

    // 1. Sign Up / Sign In a test user
    const email = '1426davejobs@gmail.com';
    const password = 'Youkickmuhdog3!';

    console.log(`Authenticating as ${email}...`);
    let { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) {
        // If user already exists, try signing in
        console.log('User might already exist, trying login...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (loginError) {
            console.error('❌ Auth failed:', loginError.message);
            return;
        }
        authData = loginData;
    }

    const user = authData.user;
    console.log(`✅ Authenticated. User ID: ${user.id}`);

    // 2. Create User Profile (if not exists)
    // Note: This might fail if the user profile already exists, so we use upsert or ignore
    const { error: profileError } = await supabase
        .from('users')
        .upsert({
            id: user.id,
            email: user.email,
            google_id: 'test-google-id',
            avatar_url: 'https://via.placeholder.com/150'
        }, { onConflict: 'id' });

    if (profileError) {
        console.error('❌ Profile creation failed:', profileError.message);
        // Continue anyway, maybe it exists
    } else {
        console.log('✅ User profile ensured.');
    }

    // 3. Create a Tree
    console.log('Creating a new family tree...');
    const { data: tree, error: treeError } = await supabase
        .from('trees')
        .insert({
            name: 'The Skywalker Family',
            owner_id: user.id,
            is_public: true
        })
        .select()
        .single();

    if (treeError) {
        console.error('❌ Tree creation failed:', treeError.message);
        return;
    }
    console.log(`✅ Tree created: ${tree.name} (${tree.id})`);

    // 4. Create Persons
    console.log('Adding persons...');
    const personsData = [
        {
            tree_id: tree.id,
            first_name: 'Anakin',
            last_name: 'Skywalker',
            gender: 'Male',
            bio: 'The Chosen One',
            dob: '1941-01-01' // 41 BBY approx
        },
        {
            tree_id: tree.id,
            first_name: 'Padmé',
            last_name: 'Amidala',
            gender: 'Female',
            bio: 'Queen of Naboo',
            dob: '1946-01-01' // 46 BBY approx
        },
        {
            tree_id: tree.id,
            first_name: 'Luke',
            last_name: 'Skywalker',
            gender: 'Male',
            bio: 'Jedi Knight',
            dob: '1919-01-01' // 19 BBY
        },
        {
            tree_id: tree.id,
            first_name: 'Leia',
            last_name: 'Organa',
            gender: 'Female',
            bio: 'General',
            dob: '1919-01-01' // 19 BBY
        }
    ];

    const { data: persons, error: personsError } = await supabase
        .from('persons')
        .insert(personsData)
        .select();

    if (personsError) {
        console.error('❌ Persons creation failed:', personsError.message);
        return;
    }
    console.log(`✅ Added ${persons.length} persons.`);

    const anakin = persons.find(p => p.first_name === 'Anakin');
    const padme = persons.find(p => p.first_name === 'Padmé');
    const luke = persons.find(p => p.first_name === 'Luke');
    const leia = persons.find(p => p.first_name === 'Leia');

    // 5. Create Relationships
    console.log('Linking relationships...');
    const relationshipsData = [
        // Anakin & Padme (Spouse)
        {
            tree_id: tree.id,
            person_1_id: anakin.id,
            person_2_id: padme.id,
            type: 'spouse'
        },
        // Anakin -> Luke (Parent)
        {
            tree_id: tree.id,
            person_1_id: anakin.id,
            person_2_id: luke.id,
            type: 'parent_child'
        },
        // Padme -> Luke (Parent)
        {
            tree_id: tree.id,
            person_1_id: padme.id,
            person_2_id: luke.id,
            type: 'parent_child'
        },
        // Anakin -> Leia (Parent)
        {
            tree_id: tree.id,
            person_1_id: anakin.id,
            person_2_id: leia.id,
            type: 'parent_child'
        },
        // Padme -> Leia (Parent)
        {
            tree_id: tree.id,
            person_1_id: padme.id,
            person_2_id: leia.id,
            type: 'parent_child'
        }
    ];

    const { error: relError } = await supabase
        .from('relationships')
        .insert(relationshipsData);

    if (relError) {
        console.error('❌ Relationship creation failed:', relError.message);
        return;
    }
    console.log('✅ Relationships linked.');

    console.log('🎉 Seed completed successfully!');
}

seed();
