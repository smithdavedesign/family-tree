const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3000/api';
// We need a valid JWT to test this, so we'll mock the request or use a test account if available.
// However, since I can run code on the server, I can test the controller logic directly or use a dummy request.

async function testRedeem() {
    console.log('Testing Coupon Redemption...');

    // Test with invalid code
    try {
        console.log('Case 1: Invalid Code');
        const res = await axios.post(`${API_URL}/subscription/redeem`, { code: 'WRONG' });
        console.log('Unexpected success:', res.data);
    } catch (error) {
        console.log('Correctly failed with:', error.response?.status, error.response?.data?.error);
    }

    // Test with valid code (requires auth, so we'll check the controller logic via a script that bypasses auth for testing)
    console.log('\nCase 2: Valid Code (Direct DB Check)');
    // Since I have node access, I'll run a direct script to simulate the controller's DB operations.
}

testRedeem();
