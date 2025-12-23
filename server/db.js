const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Check your .env file.');
}

// Public client (respects RLS)
const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client (bypasses RLS) - Use ONLY for server-side admin tasks like webhooks
const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

if (!supabaseAdmin) {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY missing. Admin operations will fail.');
}

console.log('✅ Supabase client initialized');

module.exports = { supabase, supabaseAdmin };