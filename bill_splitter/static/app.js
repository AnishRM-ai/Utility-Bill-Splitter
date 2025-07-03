let accessToken = '';
let currentUser = '';

// Toggle between Register/Login Forms
function showLogin() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

// Register a new user
async function register() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;

    const response = await fetch('/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        alert('Registration successful! Please login.');
        showLogin();
    } else {
        alert('Registration failed. Try another username.');
    }
}

// Login and fetch bills/debts
async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const response = await fetch('/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        accessToken = data.access;
        currentUser = username;

        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('username').textContent = username;

        fetchBills();
        fetchDebts();
    } else {
        alert('Login failed. Check credentials.');
    }
}

// Fetch all bills
async function fetchBills() {
    const response = await fetch('/api/bills/', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const bills = await response.json();
    
    let billsHTML = '';
    bills.forEach(bill => {
        billsHTML += `
            <div class="bill">
                <strong>${bill.title}</strong> - $${bill.amount}
                <p>Paid by: ${bill.paid_by.username}</p>
            </div>
        `;
    });
    document.getElementById('bills').innerHTML = billsHTML;
}

// Fetch user's debts
async function fetchDebts() {
    const response = await fetch('/api/splits/my_debts/', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const debts = await response.json();
    
    let debtsHTML = '';
    debts.forEach(debt => {
        debtsHTML += `
            <div class="bill">
                <strong>${debt.bill.title}</strong> - You owe: $${debt.amount_owed}
                <button onclick="settleDebt(${debt.id})">Mark as Paid</button>
            </div>
        `;
    });
    document.getElementById('debts').innerHTML = debtsHTML;
}

// Create a new bill
async function createBill() {
    const title = document.getElementById('billTitle').value;
    const amount = document.getElementById('billAmount').value;

    await fetch('/api/bills/', {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, amount })
    });

    fetchBills();  // Refresh bills list
    fetchDebts();  // Refresh debts list (if split affects the user)
}

// Settle a debt
async function settleDebt(splitId) {
    await fetch(`/api/splits/${splitId}/settle/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    fetchDebts();  // Refresh debts list
}

// Logout
function logout() {
    accessToken = '';
    currentUser = '';
    document.getElementById('app').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}