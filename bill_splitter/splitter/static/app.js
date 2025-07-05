// ========== Global Variables ==========
let accessToken = '';
let currentUser = '';

// ========== DOM Elements ==========
const elements = {
    registerForm: document.getElementById('registerForm'),
    loginForm: document.getElementById('loginForm'),
    app: document.getElementById('app'),
    loading: document.getElementById('loading'),
    messages: document.getElementById('systemMessages')
};

// ========== Helper Functions ==========
function showMessage(message, type = 'info') {
    elements.messages.innerHTML = `
        <div class="message ${type}-message">
            ${message}
        </div>
    `;
    setTimeout(() => elements.messages.innerHTML = '', 5000);
}

function showLoading() {
    elements.loading.classList.remove('hidden');
}

function hideLoading() {
    elements.loading.classList.add('hidden');
}

function toggleForms(showRegister) {
    elements.registerForm.classList.toggle('hidden', !showRegister);
    elements.loginForm.classList.toggle('hidden', showRegister);
}

// ========== Auth Functions ==========
async function register() {
    showLoading();
    try {
        const response = await fetch('/api/register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: document.getElementById('regUsername').value,
                password: document.getElementById('regPassword').value
            })
        });

        if (!response.ok) throw new Error('Registration failed');
        showMessage('Registration successful! Please login.', 'success');
        toggleForms(false); // Show login form
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function login() {
    showLoading();
    try {
        const response = await fetch('/api/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: document.getElementById('loginUsername').value,
                password: document.getElementById('loginPassword').value
            })
        });

        if (!response.ok) throw new Error('Login failed');
        
        const data = await response.json();
        accessToken = data.access;
        currentUser = document.getElementById('loginUsername').value;
        
        // Update UI
        document.getElementById('username').textContent = currentUser;
        elements.loginForm.classList.add('hidden');
        elements.app.classList.remove('hidden');
        
        // Load data
        await Promise.all([fetchBills(), fetchDebts()]);
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function logout() {
    accessToken = '';
    currentUser = '';
    elements.app.classList.add('hidden');
    toggleForms(false); // Show login form
    clearData();
}

// ========== Bill Functions ==========
async function fetchBills() {
    showLoading();
    try {
        const response = await fetch('/api/bills/', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load bills');
        
        const bills = await response.json();
        renderBills(bills);
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderBills(bills) {
    const container = document.getElementById('bills');
    if (bills.length === 0) {
        container.innerHTML = '<p>No bills found</p>';
        return;
    }

    container.innerHTML = bills.map(bill => `
        <div class="bill">
            <strong>${bill.title}</strong> - $${bill.amount.toFixed(2)}
            <p>Paid by: ${bill.paid_by.username} on ${new Date(bill.date).toLocaleDateString()}</p>
            ${bill.splits.map(split => `
                <div class="split">
                    ${split.user.username}: $${split.amount_owed.toFixed(2)} 
                    (${split.is_paid ? 'Paid' : 'Pending'})
                </div>
            `).join('')}
        </div>
    `).join('');
}

async function createBill() {
    showLoading();
    try {
        const response = await fetch('/api/bills/', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: document.getElementById('billTitle').value,
                amount: parseFloat(document.getElementById('billAmount').value)
            })
        });

        if (!response.ok) throw new Error('Failed to create bill');
        
        showMessage('Bill created successfully!', 'success');
        document.getElementById('billTitle').value = '';
        document.getElementById('billAmount').value = '';
        await Promise.all([fetchBills(), fetchDebts()]);
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ========== Debt Functions ==========
async function fetchDebts() {
    showLoading();
    try {
        const response = await fetch('/api/splits/my_debts/', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load debts');
        
        const debts = await response.json();
        renderDebts(debts);
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderDebts(debts) {
    const container = document.getElementById('debts');
    if (debts.length === 0) {
        container.innerHTML = '<p>No outstanding debts!</p>';
        return;
    }

    // Calculate total debt
    const totalDebt = debts.reduce((sum, debt) => sum + debt.amount_owed, 0);
    
    container.innerHTML = `
        <p><strong>Total Outstanding:</strong> $${totalDebt.toFixed(2)}</p>
        ${debts.map(debt => `
            <div class="debt">
                <strong>${debt.bill.title}</strong><br>
                Amount: $${debt.amount_owed.toFixed(2)}<br>
                Paid by: ${debt.bill.paid_by.username}<br>
                <button onclick="settleDebt(${debt.id})">Mark as Paid</button>
            </div>
        `).join('')}
    `;
}

async function settleDebt(debtId) {
    if (!confirm('Are you sure you want to mark this debt as paid?')) return;
    
    showLoading();
    try {
        const response = await fetch(`/api/splits/${debtId}/settle/`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 403) {
            throw new Error('You can only settle your own debts');
        }
        if (!response.ok) throw new Error('Failed to settle debt');
        
        const result = await response.json();
        showMessage(`Successfully paid $${result.amount_owed.toFixed(2)} for ${result.bill_title}`, 'success');
        await fetchDebts();
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ========== Initialize App ==========
function clearData() {
    document.getElementById('bills').innerHTML = '';
    document.getElementById('debts').innerHTML = '';
}

function setupEventListeners() {
    // Auth forms
    document.querySelectorAll('[onclick="showLogin()"]').forEach(el => {
        el.onclick = () => toggleForms(false);
    });
    document.querySelectorAll('[onclick="showRegister()"]').forEach(el => {
        el.onclick = () => toggleForms(true);
    });
    
    // Clear forms on form toggle
    document.getElementById('registerForm').addEventListener('click', () => {
        document.getElementById('regUsername').value = '';
        document.getElementById('regPassword').value = '';
    });
    
    document.getElementById('loginForm').addEventListener('click', () => {
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
    });
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    toggleForms(false); // Start with login form
});