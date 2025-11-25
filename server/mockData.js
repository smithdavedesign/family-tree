
const MOCK_USER_ID = '8699336c-6321-49c9-83e2-af700e3d764b';
const MOCK_TREE_ID = 'tree-123';

const MOCK_TREES = [
    { id: MOCK_TREE_ID, name: 'The Skywalker Family', owner_id: MOCK_USER_ID, is_public: true }
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

const MOCK_MEDIA = [];

module.exports = {
    MOCK_USER_ID,
    MOCK_TREE_ID,
    MOCK_TREES,
    MOCK_PERSONS,
    MOCK_RELATIONSHIPS,
    MOCK_MEDIA
};
