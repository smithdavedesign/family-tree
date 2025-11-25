
// Mock data matching our seed.sql
const MOCK_USER = {
    id: '8699336c-6321-49c9-83e2-af700e3d764b',
    email: 'testuser@example.com',
    app_metadata: { provider: 'google' },
    user_metadata: { avatar_url: 'https://via.placeholder.com/150', full_name: 'Test User' },
    aud: 'authenticated',
    role: 'authenticated',
};

const MOCK_TREE_ID = 'tree-123';

const MOCK_TREES = [
    { id: MOCK_TREE_ID, name: 'The Skywalker Family', owner_id: MOCK_USER.id, is_public: true }
];

const MOCK_PERSONS = [
    { id: 'p1', tree_id: MOCK_TREE_ID, first_name: 'Anakin', last_name: 'Skywalker', gender: 'Male', bio: 'The Chosen One', dob: '1941-01-01' },
    { id: 'p2', tree_id: MOCK_TREE_ID, first_name: 'Padmé', last_name: 'Amidala', gender: 'Female', bio: 'Queen of Naboo', dob: '1946-01-01' },
    { id: 'p3', tree_id: MOCK_TREE_ID, first_name: 'Luke', last_name: 'Skywalker', gender: 'Male', bio: 'Jedi Knight', dob: '1919-01-01' },
    { id: 'p4', tree_id: MOCK_TREE_ID, first_name: 'Leia', last_name: 'Organa', gender: 'Female', bio: 'General', dob: '1919-01-01' },
];

const MOCK_RELATIONSHIPS = [
    { id: 'r1', tree_id: MOCK_TREE_ID, person_1_id: 'p1', person_2_id: 'p2', type: 'spouse' },
    { id: 'r2', tree_id: MOCK_TREE_ID, person_1_id: 'p1', person_2_id: 'p3', type: 'parent_child' },
    { id: 'r3', tree_id: MOCK_TREE_ID, person_1_id: 'p2', person_2_id: 'p3', type: 'parent_child' },
    { id: 'r4', tree_id: MOCK_TREE_ID, person_1_id: 'p1', person_2_id: 'p4', type: 'parent_child' },
    { id: 'r5', tree_id: MOCK_TREE_ID, person_1_id: 'p2', person_2_id: 'p4', type: 'parent_child' },
];

class MockSupabaseClient {
    constructor() {
        this.auth = {
            signInWithOAuth: async () => {
                console.log('🔒 [MOCK] Signing in...');
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 500));
                localStorage.setItem('sb-mock-session', JSON.stringify({ user: MOCK_USER }));
                return { data: { session: { user: MOCK_USER } }, error: null };
            },
            signOut: async () => {
                console.log('🔒 [MOCK] Signing out...');
                localStorage.removeItem('sb-mock-session');
                return { error: null };
            },
            getUser: async () => {
                const session = localStorage.getItem('sb-mock-session');
                return { data: { user: session ? JSON.parse(session).user : null }, error: null };
            },
            getSession: async () => {
                const sessionStr = localStorage.getItem('sb-mock-session');
                const session = sessionStr ? JSON.parse(sessionStr) : null;
                // Ensure we have an access_token for the mock backend
                if (session) {
                    session.access_token = 'mock-token-123';
                    session.provider_token = 'mock-provider-token';
                }
                return { data: { session }, error: null };
            },
            onAuthStateChange: (callback) => {
                // Return a dummy subscription
                return { data: { subscription: { unsubscribe: () => { } } } };
            }
        };
    }

    from(table) {
        return new MockQueryBuilder(table);
    }
}

class MockQueryBuilder {
    constructor(table) {
        this.table = table;
        this.filters = [];
    }

    select(columns) {
        return this;
    }

    eq(column, value) {
        this.filters.push({ column, value, operator: 'eq' });
        return this;
    }

    or(query) {
        // Simple parser for "col.eq.val,col2.eq.val" logic if needed, 
        // but for now we'll just store it to handle specific cases manually if strictly required.
        // Our current app usage of .or() is complex to mock perfectly generically, 
        // so we might hardcode the result for the tree fetch.
        this.filters.push({ query, operator: 'or' });
        return this;
    }

    async then(resolve, reject) {
        // Execute query
        console.log(`📡 [MOCK] Querying table: ${this.table}`, this.filters);
        await new Promise(r => setTimeout(r, 300));

        let data = [];
        if (this.table === 'trees') data = MOCK_TREES;
        if (this.table === 'persons') data = MOCK_PERSONS;
        if (this.table === 'relationships') data = MOCK_RELATIONSHIPS;

        // Apply simple EQ filters
        data = data.filter(item => {
            return this.filters.every(filter => {
                if (filter.operator === 'eq') {
                    return item[filter.column] === filter.value;
                }
                return true;
            });
        });

        resolve({ data, error: null });
    }
}

export const mockSupabase = new MockSupabaseClient();
