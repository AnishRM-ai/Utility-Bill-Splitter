async function fetchBills() {
    const response = await fetch('/api/bills/');
    const bills = await response.json();
    console.log(bills);
}
fetchBills();