const API_URL = 'http://localhost:3000/api';
let token = '';
let testTableId = null;

// Helper to log assertions
function assertEqual(actual, expected, stepName) {
    if (actual === expected) {
        console.log(`✅ [${stepName}] Passed. (Actual: ${actual})`);
    } else {
        console.error(`❌ [${stepName}] Failed! Expected: ${expected}, Got: ${actual}`);
    }
}

async function apiRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
    }
    return response.json();
}

async function loginAdmin() {
    try {
        const data = await apiRequest('/auth/login', 'POST', {
            username: 'admin',
            password: 'password123'
        });
        token = data.token;
        console.log('--- Login Successful ---');
    } catch (e) {
        console.error('Failed to login. Make sure seed data exists and server is running.', e.message);
        process.exit(1);
    }
}

async function runTests() {
    await loginAdmin();

    try {
        // 0. Create a fresh table for testing
        console.log('\n=== Setup: Create Test Table ===');
        const tRes = await apiRequest('/tables', 'POST', {
            label: `TEST-${Date.now()}`,
            capacity: 4
        });
        testTableId = tRes.table._id;
        console.log(`Created Table ID: ${testTableId}`);

        // FLOW 1: Walk-in
        console.log('\n=== FLOW 1: Walk-In ===');
        const walkInRes = await apiRequest('/reservations', 'POST', {
            bookedBy: 'WalkIn Guest',
            contact: '123',
            date: new Date().toISOString(),
            guests: 2,
            duration: 60,
            tableId: testTableId, overrideWarningConfirmed: true,
            isWalkIn: true,
            overrideWarningConfirmed: true
        });
        
        const walkInId = walkInRes.reservation._id;
        assertEqual(walkInRes.reservation.status, 'Seated', 'Walk-In creates reservation as Seated');
        
        let tablesData = await apiRequest('/tables');
        let currentTable = tablesData.tables.find(t => t._id === testTableId);
        assertEqual(currentTable.status, 'Occupied', 'Walk-In updates table to Occupied');

        // End Meal for Walk-in
        const endMealRes = await apiRequest(`/tables/${testTableId}`, 'PUT', { status: 'CLEANING' });
        assertEqual(endMealRes.table.status, 'Cleaning', 'End meal sets table to Cleaning');
        
        let resData = await apiRequest('/reservations');
        let updatedWalkIn = resData.reservations.find(res => res._id === walkInId);
        assertEqual(updatedWalkIn.status, 'Completed', 'End meal auto-completes the Seated reservation');

        // Mark Cleaned
        const cleanRes = await apiRequest(`/tables/${testTableId}`, 'PUT', { status: 'AVAILABLE' });
        assertEqual(cleanRes.table.status, 'Available', 'Mark cleaned sets table to Available');


        // FLOW 2: Standard Booking -> Check In -> End Meal
        console.log('\n=== FLOW 2: Standard Booking -> Check In -> End Meal ===');
        const futureTime = new Date();
        futureTime.setHours(futureTime.getHours() + 2);

        const bookRes = await apiRequest('/reservations', 'POST', {
            bookedBy: 'Booking Guest',
            contact: '123',
            date: futureTime.toISOString(),
            guests: 2,
            duration: 60,
            tableId: testTableId, overrideWarningConfirmed: true
        });
        
        const bookId = bookRes.reservation._id;
        assertEqual(bookRes.reservation.status, 'Pending', 'Standard booking creates reservation as Pending');
        
        tablesData = await apiRequest('/tables');
        currentTable = tablesData.tables.find(t => t._id === testTableId);
        assertEqual(currentTable.status, 'Available', 'Standard booking leaves table as Available in DB');

        // Check In
        const checkInRes = await apiRequest(`/reservations/${bookId}/checkin`, 'PUT', {});
        assertEqual(checkInRes.reservation.status, 'Seated', 'Check-In sets reservation to Seated');
        
        tablesData = await apiRequest('/tables');
        currentTable = tablesData.tables.find(t => t._id === testTableId);
        assertEqual(currentTable.status, 'Occupied', 'Check-In sets table to Occupied');

        // End Meal directly to Available (skipping cleaning)
        await apiRequest(`/tables/${testTableId}`, 'PUT', { status: 'AVAILABLE' });
        resData = await apiRequest('/reservations');
        let updatedBook = resData.reservations.find(res => res._id === bookId);
        assertEqual(updatedBook.status, 'Completed', 'Setting table directly to Available also auto-completes Seated reservations');


        // FLOW 3: Cancel
        console.log('\n=== FLOW 3: Cancel ===');
        const cancelBookRes = await apiRequest('/reservations', 'POST', {
            bookedBy: 'Cancel Guest',
            contact: '123',
            date: futureTime.toISOString(),
            guests: 2,
            duration: 60,
            tableId: testTableId, overrideWarningConfirmed: true
        });
        const cancelBookId = cancelBookRes.reservation._id;
        
        await apiRequest(`/reservations/${cancelBookId}/cancel`, 'PUT', {});
        resData = await apiRequest('/reservations');
        let cancelledRes = resData.reservations.find(res => res._id === cancelBookId);
        assertEqual(cancelledRes.status, 'Cancelled', 'Cancel sets reservation to Cancelled');
        
        tablesData = await apiRequest('/tables');
        currentTable = tablesData.tables.find(t => t._id === testTableId);
        assertEqual(currentTable.status, 'Available', 'Cancel does not mess up table status');


        // FLOW 4: No Show
        console.log('\n=== FLOW 4: No Show ===');
        const noShowBookRes = await apiRequest('/reservations', 'POST', {
            bookedBy: 'NoShow Guest',
            contact: '123',
            date: futureTime.toISOString(),
            guests: 2,
            duration: 60,
            tableId: testTableId, overrideWarningConfirmed: true
        });
        const noShowBookId = noShowBookRes.reservation._id;
        
        await apiRequest(`/reservations/${noShowBookId}/noshow`, 'PUT', {});
        resData = await apiRequest('/reservations');
        let noShowRes = resData.reservations.find(res => res._id === noShowBookId);
        assertEqual(noShowRes.status, 'No_show', 'No-Show sets reservation to No_show');

        console.log('\n=== Cleanup ===');
        console.log('Tests completed successfully!');

    } catch (error) {
        console.error('Test failed with error:', error.message);
    }
}

runTests();
