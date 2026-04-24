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

// --- HERO CAROUSEL LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.carousel-track');
    
    // Only run this if we are actually on the homepage
    if (!track) return; 

    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.next-btn');
    const prevButton = document.querySelector('.prev-btn');
    const dotsNav = document.querySelector('.carousel-nav');
    const dots = Array.from(dotsNav.children);

    let currentIndex = 0;
    let slideInterval;

    // The function that does the moving
    function moveToSlide(index) {
        // If we go past the end, loop back to the beginning
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        // Move the track by 100% of the screen width for each slide
        track.style.transform = `translateX(-${index * 100}%)`;
        
        // Update the white dot
        dots.forEach(dot => dot.classList.remove('current-indicator'));
        dots[index].classList.add('current-indicator');

        currentIndex = index;
    }

    // Listen for arrow clicks
    nextButton.addEventListener('click', () => {
        moveToSlide(currentIndex + 1);
        resetInterval(); // Restart the 5-second timer when user clicks
    });

    prevButton.addEventListener('click', () => {
        moveToSlide(currentIndex - 1);
        resetInterval();
    });

    // Listen for dot clicks
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            moveToSlide(index);
            resetInterval();
        });
    });

    // Auto-Slide function (Every 5 seconds)
    function startInterval() {
        slideInterval = setInterval(() => {
            moveToSlide(currentIndex + 1);
        }, 5000); 
    }

    function resetInterval() {
        clearInterval(slideInterval);
        startInterval();
    }

    // Start the engine!
    startInterval();
});

// --- FAQ ACCORDION LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            const answer = item.querySelector('.faq-answer');
            const isActive = item.classList.contains('active');

            // Optional: Close all other open FAQ boxes when one is clicked
            document.querySelectorAll('.faq-item').forEach(otherItem => {
                otherItem.classList.remove('active');
                otherItem.querySelector('.faq-answer').style.maxHeight = null;
            });

            // If it wasn't already open, open it
            if (!isActive) {
                item.classList.add('active');
                // Set the max-height to the exact pixel height of the inner text
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });
});

// --- CENTER-FOCUS TESTIMONIAL SLIDER ---
document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.testi-track');
    if (!track) return;

    const cards = Array.from(track.children);
    const btnNext = document.querySelector('.next-testi');
    const btnPrev = document.querySelector('.prev-testi');
    
    let currentIndex = 0;

    function updateTestimonialCarousel() {
        // Find the exact center of the visible wrapper
        const containerCenter = track.parentElement.clientWidth / 2;
        
        cards.forEach((card, index) => {
            // Apply the active pop-out effect to the current card
            if (index === currentIndex) {
                card.classList.add('active');
                
                // Calculate how much to move the track to center this specific card
                const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
                const translateValue = containerCenter - cardCenter;
                
                track.style.transform = `translateX(${translateValue}px)`;
            } else {
                card.classList.remove('active');
            }
        });
    }

    btnNext.addEventListener('click', () => {
        if (currentIndex < cards.length - 1) {
            currentIndex++;
            updateTestimonialCarousel();
        }
    });

    btnPrev.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateTestimonialCarousel();
        }
    });

    // Run once on load to center the first card
    // We use setTimeout to ensure CSS has loaded dimensions first
    setTimeout(updateTestimonialCarousel, 100);
    
    // Re-center if user resizes the browser window
    window.addEventListener('resize', updateTestimonialCarousel);
});

// --- HAMBURGER MENU LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            // Toggles the dropdown open and closed
            navLinks.classList.toggle('active');
        });
    }
});

// --- MOBILE DROPDOWN (ACCORDION) LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const dropbtn = document.querySelector('.dropbtn');
    const dropdown = document.querySelector('.dropdown');

    if (dropbtn && dropdown) {
        dropbtn.addEventListener('click', (e) => {
            // Only hijack the click if the user is on a mobile-sized screen
            if (window.innerWidth <= 768) {
                e.preventDefault(); // Stops the page from jumping
                dropdown.classList.toggle('mobile-active');
            }
        });
    }
});