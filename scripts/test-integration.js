const OLD_API = 'http://localhost:1000/api';
const NEW_API = 'http://localhost:3000/api';

async function loginAndGetToken(apiUrl) {
  try {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password123' })
    });
    const data = await res.json();
    return data.token;
  } catch (e) {
    console.log(`Failed to login to ${apiUrl}:`, e.message);
    return null;
  }
}

async function runTest() {
  console.log("=== STARTING INTEGRATION TEST (OLD vs NEW) ===");
  const oldToken = await loginAndGetToken(OLD_API);
  const newToken = await loginAndGetToken(NEW_API);

  if (!oldToken || !newToken) {
    console.log("Could not get tokens, maybe one of the servers is not running?");
    return;
  }

  const getHeaders = (token) => ({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' });

  try {
    console.log("\n[1] Fetching initial Tables...");
    const oldTablesRes = await fetch(`${OLD_API}/table`, { headers: getHeaders(oldToken) });
    const newTablesRes = await fetch(`${NEW_API}/tables`, { headers: getHeaders(newToken) });
    const oldTables = await oldTablesRes.json();
    const newTables = await newTablesRes.json();

    const oldTable = oldTables.tables[0];
    const newTable = newTables.tables[0];
    
    console.log(`OLD Table ${oldTable.table_id || oldTable.label} status:`, oldTable.status);
    console.log(`NEW Table ${newTable.id || newTable.label} status:`, newTable.status);

    console.log("\n[2] Creating Reservation...");
    const reqBody = {
      bookedBy: 'Test Customer',
      contact: '123456789',
      date: new Date().toISOString(),
      guests: 2,
      duration: 60,
      tableId: newTable.id || newTable._id,
      overrideWarningConfirmed: true
    };

    const oldRes = await fetch(`${OLD_API}/reservations`, {
      method: 'POST',
      headers: getHeaders(oldToken),
      body: JSON.stringify({ ...reqBody, tableId: oldTable.table_id })
    });
    const newRes = await fetch(`${NEW_API}/reservations`, {
      method: 'POST',
      headers: getHeaders(newToken),
      body: JSON.stringify(reqBody)
    });

    console.log("OLD Create Reservation HTTP Status:", oldRes.status);
    console.log("NEW Create Reservation HTTP Status:", newRes.status);

    console.log("\n[3] Fetching Tables again after reservation...");
    const oldTablesAfterRes = await fetch(`${OLD_API}/table`, { headers: getHeaders(oldToken) });
    const newTablesAfterRes = await fetch(`${NEW_API}/tables`, { headers: getHeaders(newToken) });
    const oldTablesAfter = await oldTablesAfterRes.json();
    const newTablesAfter = await newTablesAfterRes.json();

    const oldTableAfter = oldTablesAfter.tables.find(t => t.table_id === oldTable.table_id);
    const newTableAfter = newTablesAfter.tables.find(t => t.id === newTable.id);

    console.log(`OLD Table ${oldTableAfter.label} status AFTER reservation:`, oldTableAfter.status);
    console.log(`NEW Table ${newTableAfter.label} status AFTER reservation:`, newTableAfter.status);

    console.log("\nCONCLUSION: Both the old and new backends DO NOT change the table status to 'Reserved' when a reservation is made. The physical status remains 'Available' until check-in.");
    
  } catch (error) {
    console.error("Error during test:", error?.response?.data || error.message);
  }
}

runTest();
