function sendContactForm() {
    // 1. Grab values from the HTML
    let layanan = document.getElementById("contact-layanan").value;
    let nama = document.getElementById("contact-nama").value.trim();
    let pesan = document.getElementById("contact-pesan").value.trim();

    // 2. Build the greeting (Handles optional name)
    let greeting = "";
    if (nama === "") {
        greeting = "Halo Jastipinajacn,";
    } else {
        greeting = `Halo Jastipinajacn, saya ${nama}.`;
    }

    // 3. Build the core intent
    let coreIntent = `Saya ingin bertanya mengenai ${layanan}.`;

    // 4. Build the extra details (Handles optional paragraph)
    let extraDetails = "";
    if (pesan !== "") {
        // \n\n creates two line breaks (Enter key) in WhatsApp
        extraDetails = `\n\nDetail pertanyaan:\n${pesan}`; 
    }

    // 5. Combine everything
    let finalMessage = `${greeting} ${coreIntent}${extraDetails}`;

    // 6. Encode and send
    let encodedMessage = encodeURIComponent(finalMessage);
    let phoneNumber = "6281234567890"; // Remember to ensure this is your actual number
    
    let whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappURL, "_blank");
}
function calculateJastip() {
    // 1. Get Inputs
    const rmb = parseFloat(document.getElementById('calc-rmb').value) || 0;
    const kg = parseFloat(document.getElementById('calc-kg').value) || 0;
    const shipRate = parseFloat(document.getElementById('calc-method').value);
    const kurs = 2500;

    // 2. Logic for Tiered Fee %
    let feePercent = 0.15; // Default < 1000
    if (rmb >= 1000 && rmb <= 5000) {
        feePercent = 0.10;
    } else if (rmb > 5000) {
        feePercent = 0.05;
    }

    // 3. Perform Calculations
    const hargaBarangIDR = rmb * kurs;
    const jastipFee = hargaBarangIDR * feePercent;
    const ongkir = kg * shipRate;
    const grandTotal = hargaBarangIDR + jastipFee + ongkir;

    // 4. Update UI with Currency Formatting
    document.getElementById('res-fee').innerText = "Rp " + Math.round(jastipFee).toLocaleString('id-ID');
    document.getElementById('res-ongkir').innerText = "Rp " + Math.round(ongkir).toLocaleString('id-ID');
    document.getElementById('res-total').innerText = "Rp " + Math.round(grandTotal).toLocaleString('id-ID');
}

// --- TOP UP PAGE LOGIC ---

// Global variable to store the fetched rate so we don't spam the API
let currentTopupRate = 0; 

// 1. Function to Fetch the Live Rate from the API
async function initTopupPage() {
    // Only run this if we are actually on the Top Up page
    if (!document.getElementById('display-live-rate')) return;

    try {
        // Fetch the open exchange rate API (Base: CNY)
        const response = await fetch('https://open.er-api.com/v6/latest/CNY');
        const data = await response.json();
        
        // Get the raw IDR rate
        const rawRate = data.rates.IDR; 
        
        // Add your 2% buffer/margin
        currentTopupRate = rawRate * 1.02; 

        // Update the big text on the page
        document.getElementById('display-live-rate').innerText = "Rp " + Math.round(currentTopupRate).toLocaleString('id-ID');
        
        // If there's already a number in the calculator, run it
        calculateTopup();

    } catch (error) {
        console.error("Gagal mengambil rate:", error);
        // Fallback rate just in case the API goes down
        currentTopupRate = 2250; 
        document.getElementById('display-live-rate').innerText = "Rp 2.250 (Estimasi)";
    }
}

// 2. The Calculator Logic for Top Up
function calculateTopup() {
    const rmbInput = document.getElementById('topup-rmb');
    if (!rmbInput) return; // Exit if not on the page

    const rmb = parseFloat(rmbInput.value) || 0;
    
    // Safety check: ensure rate is loaded
    if (currentTopupRate === 0) return; 

    // Logic for Service Fee % based strictly on RMB threshold
    let feePercent = 0;
    if (rmb > 0 && rmb < 100) {
        feePercent = 0.10; // 10%
    } else if (rmb >= 100 && rmb <= 999) {
        feePercent = 0.02; // 2%
    } else if (rmb >= 1000) {
        feePercent = 0;    // 0% (Gratis)
    }

    // Calculations
    const baseIDR = rmb * currentTopupRate;
    const serviceFeeIDR = baseIDR * feePercent;
    const grandTotal = baseIDR + serviceFeeIDR;

    // Update UI
    document.getElementById('res-topup-rate').innerText = "Rp " + Math.round(currentTopupRate).toLocaleString('id-ID');
    document.getElementById('res-topup-fee').innerText = "Rp " + Math.round(serviceFeeIDR).toLocaleString('id-ID') + ` (${feePercent * 100}%)`;
    document.getElementById('res-topup-total').innerText = "Rp " + Math.round(grandTotal).toLocaleString('id-ID');
}
