function getContactMessage() {
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

    return finalMessage;
}

function sendContactForm() {
    const whatsappURL = `https://wa.me/6285102280001?text=${encodeURIComponent(getContactMessage())}`;
    window.open(whatsappURL, '_blank', 'noopener,noreferrer');
}
function calculateJastip() {
    // 1. Get Inputs
    const rmb = Math.max(0, parseFloat(document.getElementById('calc-rmb').value) || 0);
    const kg = Math.max(0, parseFloat(document.getElementById('calc-kg').value) || 0);
    const shipRate = parseFloat(document.getElementById('calc-method').value);
    const kurs = 2700;

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
    const goods = document.getElementById('res-goods');
    const feeLabel = document.getElementById('res-fee-percent');
    if (goods) goods.innerText = 'Rp ' + Math.round(hargaBarangIDR).toLocaleString('id-ID');
    if (feeLabel) feeLabel.innerText = `(${feePercent * 100}%)`;
}

// --- TOP UP PAGE LOGIC ---

// Global variable to store the fetched rate so we don't spam the API
let currentTopupRate = 0; 

// 1. Function to Fetch the Live Rate from the API
async function initTopupPage() {
    // Only run this if we are actually on the Top Up page
    if (!document.getElementById('display-live-rate')) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        // Fetch the open exchange rate API (Base: CNY)
        const response = await fetch('https://open.er-api.com/v6/latest/CNY', { signal: controller.signal });
        if (!response.ok) throw new Error('Rate request failed');
        const data = await response.json();
        
        // Get the raw IDR rate
        const rawRate = data.rates?.IDR;
        if (!Number.isFinite(rawRate) || rawRate <= 0) throw new Error('Invalid exchange rate');
        
        // Add your 2% buffer/margin
        currentTopupRate = rawRate * 1.02; 

        // Update the big text on the page
        document.getElementById('display-live-rate').innerText = "Rp " + Math.round(currentTopupRate).toLocaleString('id-ID');
        
        // If there's already a number in the calculator, run it
        calculateTopup();
        const status = document.getElementById('rate-status');
        if (status) status.innerText = 'Kurs berhasil dimuat · konfirmasi rate akhir ke admin';

    } catch (error) {
        console.error("Gagal mengambil rate:", error);
        // Fallback rate just in case the API goes down
        currentTopupRate = 2250; 
        document.getElementById('display-live-rate').innerText = "Rp 2.250 (Estimasi)";
        const status = document.getElementById('rate-status');
        if (status) status.innerText = 'Kurs belum tersedia · memakai rate estimasi';
        calculateTopup();
    } finally {
        clearTimeout(timeout);
    }
}

// 2. The Calculator Logic for Top Up
function calculateTopup() {
    const rmbInput = document.getElementById('topup-rmb');
    if (!rmbInput) return; // Exit if not on the page

    const rmb = Math.max(0, parseFloat(rmbInput.value) || 0);
    
    // Safety check: ensure rate is loaded
    if (currentTopupRate === 0) return; 

    // Logic for Service Fee % based strictly on RMB threshold
    let feePercent = 0;
    if (rmb > 0 && rmb < 100) {
        feePercent = 0.10; // 10%
    } else if (rmb >= 100 && rmb < 1000) {
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
            currentIndex++; // Go to next
        } else {
            currentIndex = 0; // If at the end, jump back to the first card
        }
        updateTestimonialCarousel();
    });

    btnPrev.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--; // Go to previous
        } else {
            currentIndex = cards.length - 1; // If at the beginning, jump to the last card
        }
        updateTestimonialCarousel();
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
// --- GALLERY LIGHTBOX LOGIC (WITH ARROWS) ---
document.addEventListener('DOMContentLoaded', () => {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    const galleryItems = document.querySelectorAll('.gallery-item');

    let currentIndex = 0; // Remembers which photo we are looking at

    // Only run if the gallery exists on this page
    if (lightbox && galleryItems.length > 0) {
        
        // Function to load a specific image by its index number
        function showImage(index) {
            const item = galleryItems[index];
            const img = item.querySelector('img');
            const caption = item.querySelector('p');
            
            lightboxImg.src = img.src;
            lightboxCaption.innerHTML = caption.innerHTML;
            currentIndex = index; // Save this as the current photo
        }

        // Open Lightbox when an item is clicked
        galleryItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                lightbox.style.display = 'block';
                showImage(index);
            });
        });

        // Close Lightbox
        closeBtn.addEventListener('click', () => {
            lightbox.style.display = 'none';
        });

        // Navigate Left (Previous)
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Stops the click from accidentally closing the lightbox
            let newIndex = currentIndex - 1;
            if (newIndex < 0) newIndex = galleryItems.length - 1; // Loop to end
            showImage(newIndex);
        });

        // Navigate Right (Next)
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let newIndex = currentIndex + 1;
            if (newIndex >= galleryItems.length) newIndex = 0; // Loop to start
            showImage(newIndex);
        });

        // Close Lightbox when clicking the dark background (but NOT the image or buttons)
        lightbox.addEventListener('click', (e) => {
            if (e.target !== lightboxImg && e.target !== prevBtn && e.target !== nextBtn) {
                lightbox.style.display = 'none';
            }
        });
    }
});

// --- GALLERY LIGHTBOX LOGIC (WITH ARROWS, AUTO-GENERATE & TAGS) ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Tags follow the photo numbering: doc1.jpg is the first entry.
    const imageTags = [
        "packet", "fashion", "cosmetics", "marvis", "general", "fake nails", "pokemon", "bags", "general", "fashion",
        "general", "general", "general", "general, fashion", "general, fashion", "food", "general", "cosmetics", "fashion", "fashion",
        "fashion", "fashion", "general", "fashion", "fashion", "general, fashion", "general", "electronics", "fashion", "general",
        "electronics", "fake nails", "fashion", "bags", "fake nails", "fashion", "packet", "food", "fashion", "general",
        "fashion", "general", "general", "general", "fake nails", "fashion", "general, fashion", "general, fashion", "food", "fashion",
        "general", "electronics", "general", "fashion", "general", "general", "fake nails", "fashion", "fashion", "general",
        "miscellaneous", "fake nails", "fashion", "fake nails", "fashion", "fashion", "general", "fashion", "food", "general",
        "fashion", "fake nails", "fake nails", "fake nails", "fashion", "fashion", "general, fashion", "general, fashion", "fashion", "general, electronics",
        "general", "general", "fake nails", "general", "miscellaneous", "fashion", "miscellaneous", "diecast", "diecast", "miscellaneous",
        "fashion", "packet", "general", "general ,fashion", "general , electronics", "fashion", "general", "general", "general", "fake nails",
        "general", "general, fashion", "general", "general", "fashion", "fashion", "general, fashion", "jewelries", "general", "packet",
        "general", "electronics", "fake nails", "fake nails", "pokemon", "general", "electronics", "fake nails", "electronics", "electronics", "electronics",
        // Newly imported documentation: doc122.jpg through doc195.jpg.
        "fashion", // doc122.jpg
        "general, fashion, food, cosmetics", // doc123.jpg
        "general, fashion", // doc124.jpg
        "general, fake nails", // doc125.jpg
        "general, fashion", // doc126.jpg
        "fashion", // doc127.jpg
        "general, fashion, jewelries, bags", // doc128.jpg
        "fashion", // doc129.jpg
        "jewelries", // doc130.jpg
        "general, food, fake nails", // doc131.jpg
        "fashion", // doc132.jpg
        "cosmetics", // doc133.jpg
        "general, food", // doc134.jpg
        "general, fashion, food", // doc135.jpg
        "fashion", // doc136.jpg
        "fashion", // doc137.jpg
        "general, fashion", // doc138.jpg
        "fashion", // doc139.jpg
        "general, fashion", // doc140.jpg
        "general, fashion, pokemon", // doc141.jpg
        "general, pokemon", // doc142.jpg
        "electronics", // doc143.jpg
        "electronics", // doc144.jpg
        "electronics", // doc145.jpg
        "general, fashion, fake nails", // doc146.jpg
        "fake nails", // doc147.jpg
        "fashion", // doc148.jpg
        "general, bags, electronics", // doc149.jpg
        "jewelries, electronics", // doc150.jpg
        "jewelries", // doc151.jpg
        "jewelries", // doc152.jpg
        "miscellaneous", // doc153.jpg
        "miscellaneous", // doc154.jpg
        "general, fashion, pokemon", // doc155.jpg
        "fashion", // doc156.jpg
        "general, fashion", // doc157.jpg
        "general, fashion, food, pokemon", // doc158.jpg
        "pokemon", // doc159.jpg
        "miscellaneous", // doc160.jpg
        "pokemon", // doc161.jpg
        "electronics", // doc162.jpg
        "general", // doc163.jpg
        "general, fashion, bags", // doc164.jpg
        "general, bags, food, cosmetics", // doc165.jpg
        "general, fashion", // doc166.jpg
        "fashion", // doc167.jpg
        "general, fashion, food", // doc168.jpg
        "fashion", // doc169.jpg
        "miscellaneous", // doc170.jpg
        "miscellaneous", // doc171.jpg
        "fashion, bags, food", // doc172.jpg
        "miscellaneous", // doc173.jpg
        "general, fashion, cosmetics", // doc174.jpg
        "general, fashion, food", // doc175.jpg
        "general, fashion, fake nails", // doc176.jpg
        "general, fashion, fake nails", // doc177.jpg
        "fashion", // doc178.jpg
        "general, fashion, food, bags", // doc179.jpg
        "fashion", // doc180.jpg
        "general", // doc181.jpg
        "general, cosmetics, pokemon", // doc182.jpg
        "general, fashion", // doc183.jpg
        "general, fashion, food", // doc184.jpg
        "general, fashion, jewelries", // doc185.jpg
        "general, fashion, bags", // doc186.jpg
        "general, fashion, electronics", // doc187.jpg
        "fashion", // doc188.jpg
        "general, fashion, diecast", // doc189.jpg
        "general, fashion, bags, electronics", // doc190.jpg
        "general, cosmetics", // doc191.jpg
        "fashion", // doc192.jpg
        "fashion", // doc193.jpg
        "fashion", // doc194.jpg
        "general, fashion, jewelries, pokemon" // doc195.jpg
    ];

    // 2. AUTO-GENERATE PHOTOS & TAGS
    const autoGallery = document.getElementById('auto-gallery');
    if (autoGallery) {
        let galleryHTML = '';

        for (let i = 0; i < imageTags.length; i++) {
            const docNumber = i + 1; // Since arrays start at 0, doc1 is index 0
            
            // Split tags by comma and create the HTML pills for each
            const rawTags = imageTags[i].split(',');
            let tagsHTML = '';
            rawTags.forEach(tag => {
                const cleanTag = tag.trim(); // Removes accidental spaces
                tagsHTML += `<span class="gallery-tag">${cleanTag}</span>`;
            });

            galleryHTML += `
                <div class="gallery-item">
                    <img src="Testi_Photo/doc${docNumber}.jpg" alt="Dokumentasi ${docNumber}" loading="lazy">
                    <div class="gallery-tags-container">
                        ${tagsHTML}
                    </div>
                </div>
            `;
        }
        autoGallery.innerHTML = galleryHTML;
    }

    // 3. THE LIGHTBOX LOGIC
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    
    const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    let currentIndex = 0;

    if (lightbox && galleryItems.length > 0) {
        const visibleItems = () => galleryItems.filter(item => !item.hidden);

        function showImage(index) {
            const item = visibleItems()[index];
            const img = item.querySelector('img');
            const tagsContainer = item.querySelector('.gallery-tags-container');
            
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            // Copies the same exact pill tags into the lightbox popup!
            lightboxCaption.innerHTML = tagsContainer.innerHTML; 
            currentIndex = index; 
        }

        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                lightbox.style.display = 'block';
                showImage(visibleItems().indexOf(item));
            });
        });

        closeBtn.addEventListener('click', () => {
            lightbox.style.display = 'none';
        });

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            let newIndex = currentIndex - 1;
            if (newIndex < 0) newIndex = visibleItems().length - 1;
            showImage(newIndex);
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let newIndex = currentIndex + 1;
            if (newIndex >= visibleItems().length) newIndex = 0;
            showImage(newIndex);
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target !== lightboxImg && e.target !== prevBtn && e.target !== nextBtn) {
                lightbox.style.display = 'none';
            }
        });
    }
});
