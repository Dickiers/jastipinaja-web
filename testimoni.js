document.addEventListener('DOMContentLoaded', () => {
  const gallery = document.getElementById('auto-gallery');
  if (!gallery) return;

  // The shared script builds the photo gallery before this page-specific setup runs.
  const items = Array.from(gallery.querySelectorAll('.gallery-item'));
  document.getElementById('gallery-total').textContent = items.length;
  const filters = Array.from(document.querySelectorAll('.proof-filter'));
  const count = document.getElementById('gallery-count');
  const more = document.getElementById('gallery-more');
  const galleryViewport = document.getElementById('gallery-viewport');
  const storyViewport = document.getElementById('story-carousel');
  const storyTrack = storyViewport.querySelector('.proof-story-track');
  const stories = Array.from(storyTrack.querySelectorAll('.testi-card'));
  const storyPrev = document.getElementById('story-prev');
  const storyNext = document.getElementById('story-next');
  const storyPosition = document.getElementById('story-position');
  const storyDots = document.getElementById('story-dots');
  const storyWrapper = storyViewport.closest('.testi-wrapper');
  const lightbox = document.getElementById('lightbox');
  const close = document.querySelector('.lightbox-close');
  const lightboxImage = document.getElementById('lightbox-img');
  const hamburger = document.querySelector('.hamburger');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeFilter = 'all';
  let galleryExpanded = false;
  let lastFocusedItem = null;
  let currentStory = 0;
  let storyTimer;
  let pointerOverStories = false;
  let touchStart = null;
  let wrapTarget = null;
  const firstClone = stories[0].cloneNode(true);
  const lastClone = stories[stories.length - 1].cloneNode(true);
  firstClone.setAttribute('aria-hidden', 'true');
  lastClone.setAttribute('aria-hidden', 'true');
  storyTrack.prepend(lastClone);
  storyTrack.append(firstClone);

  stories.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Lihat testimoni ${index + 1}`);
    dot.addEventListener('click', () => {
      showStory(index);
      restartStoryTimer();
    });
    storyDots.appendChild(dot);
  });

  function showStory(index) {
    if (wrapTarget !== null) jumpToRealStory();
    const wrapped = index < 0 || index >= stories.length;
    currentStory = (index + stories.length) % stories.length;
    const card = index < 0 ? lastClone : index >= stories.length ? firstClone : stories[currentStory];
    Array.from(storyTrack.children).forEach(item => item.classList.toggle('active', item === card));
    const center = storyViewport.clientWidth / 2 - (card.offsetLeft + card.offsetWidth / 2);
    storyTrack.style.transform = `translateX(${center}px)`;
    wrapTarget = wrapped && !reducedMotion ? currentStory : null;
    storyPosition.textContent = `${currentStory + 1} dari ${stories.length}`;
    Array.from(storyDots.children).forEach((dot, dotIndex) => {
      const active = dotIndex === currentStory;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-pressed', String(active));
    });
    if (wrapped && reducedMotion) jumpToRealStory();
  }

  function jumpToRealStory() {
    const card = stories[currentStory];
    storyTrack.style.transition = 'none';
    Array.from(storyTrack.children).forEach(item => item.classList.toggle('active', item === card));
    const center = storyViewport.clientWidth / 2 - (card.offsetLeft + card.offsetWidth / 2);
    storyTrack.style.transform = `translateX(${center}px)`;
    storyTrack.getBoundingClientRect();
    storyTrack.style.transition = '';
    wrapTarget = null;
  }

  storyTrack.addEventListener('transitionend', event => {
    if (event.target === storyTrack && event.propertyName === 'transform' && wrapTarget !== null) jumpToRealStory();
  });

  function stopStoryTimer() {
    window.clearInterval(storyTimer);
  }

  function restartStoryTimer() {
    stopStoryTimer();
    if (reducedMotion || pointerOverStories || document.hidden || storyWrapper.contains(document.activeElement)) return;
    storyTimer = window.setInterval(() => showStory(currentStory + 1), 5500);
  }

  storyPrev.addEventListener('click', () => { showStory(currentStory - 1); restartStoryTimer(); });
  storyNext.addEventListener('click', () => { showStory(currentStory + 1); restartStoryTimer(); });
  storyWrapper.addEventListener('pointerenter', () => { pointerOverStories = true; stopStoryTimer(); });
  storyWrapper.addEventListener('pointerleave', () => { pointerOverStories = false; restartStoryTimer(); });
  storyWrapper.addEventListener('focusin', stopStoryTimer);
  storyWrapper.addEventListener('focusout', () => window.setTimeout(() => {
    if (!storyWrapper.contains(document.activeElement)) restartStoryTimer();
  }, 0));
  storyViewport.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showStory(currentStory + (event.key === 'ArrowRight' ? 1 : -1));
    restartStoryTimer();
  });
  storyViewport.addEventListener('touchstart', event => {
    touchStart = { x: event.changedTouches[0].screenX, y: event.changedTouches[0].screenY };
    stopStoryTimer();
  }, { passive: true });
  storyViewport.addEventListener('touchend', event => {
    if (!touchStart) return;
    const deltaX = event.changedTouches[0].screenX - touchStart.x;
    const deltaY = event.changedTouches[0].screenY - touchStart.y;
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) showStory(currentStory + (deltaX < 0 ? 1 : -1));
    touchStart = null;
    pointerOverStories = false;
    restartStoryTimer();
  }, { passive: true });
  document.addEventListener('visibilitychange', restartStoryTimer);
  window.addEventListener('resize', () => showStory(currentStory));
  storyTrack.style.transition = 'none';
  showStory(0);
  requestAnimationFrame(() => { storyTrack.style.transition = ''; });
  restartStoryTimer();

  items.forEach((item, index) => {
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Lihat foto dokumentasi ${index + 1}`);
    item.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        item.click();
      }
    });
    item.addEventListener('click', () => {
      lastFocusedItem = item;
      lightboxImage.alt = `Foto dokumentasi ${index + 1}`;
      document.body.style.overflow = 'hidden';
      close.focus();
    });
  });

  // Assign a thumbnail URL only when its card approaches the visible area.
  // IntersectionObserver accounts for clipping inside the scrollable gallery.
  const loadPreview = item => {
    const image = item.querySelector('img[data-src]');
    if (!image) return;
    image.src = image.dataset.src;
    image.removeAttribute('data-src');
  };
  const previewObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting || entry.target.hidden) return;
          loadPreview(entry.target);
          previewObserver.unobserve(entry.target);
        });
      }, { rootMargin: '250px 0px' })
    : null;
  if (previewObserver) items.forEach(item => previewObserver.observe(item));

  function matchingItems() {
    if (activeFilter === 'all') return items;
    const categoryTags = {
      fashion: ['fashion', 'bags', 'jewelries'],
      'fake nails': ['fake nails', 'cosmetics', 'marvis'],
      electronics: ['electronics'],
      food: ['food'],
      general: ['general', 'miscellaneous', 'packet', 'diecast', 'pokemon']
    };
    return items.filter(item =>
      Array.from(item.querySelectorAll('.gallery-tag')).some(tag =>
        categoryTags[activeFilter].includes(tag.textContent.trim().toLowerCase())
      )
    );
  }

  function renderGallery() {
    const matches = matchingItems();
    const visibleSet = new Set(galleryExpanded ? matches : matches.slice(0, 8));
    items.forEach(item => {
      item.hidden = !visibleSet.has(item);
      if (!item.hidden && !previewObserver) loadPreview(item);
    });
    count.textContent = galleryExpanded
      ? `${matches.length} foto tersedia. Gulir di dalam galeri untuk melihat semuanya.`
      : `Menampilkan ${Math.min(8, matches.length)} dari ${matches.length} foto`;
    more.hidden = !galleryExpanded && matches.length <= 8;
    more.innerHTML = galleryExpanded ? 'Tutup galeri <span aria-hidden="true">↑</span>' : 'Lihat lebih banyak foto <span aria-hidden="true">↓</span>';
    more.setAttribute('aria-expanded', String(galleryExpanded));
  }

  function collapseGallery() {
    galleryExpanded = false;
    galleryViewport.scrollTop = 0;
    galleryViewport.tabIndex = -1;
    galleryViewport.classList.remove('is-expanded');
    renderGallery();
    galleryViewport.style.height = `${gallery.getBoundingClientRect().height}px`;
    window.setTimeout(() => {
      if (!galleryExpanded) galleryViewport.style.height = '';
    }, 550);
  }

  filters.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filters.forEach(filter => {
      const active = filter === button;
      filter.classList.toggle('is-active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    if (galleryExpanded && matchingItems().length <= 8) collapseGallery();
    else {
      galleryViewport.scrollTop = 0;
      renderGallery();
    }
  }));

  more.addEventListener('click', () => {
    if (galleryExpanded) {
      collapseGallery();
      return;
    }
    const startHeight = galleryViewport.getBoundingClientRect().height;
    galleryViewport.style.height = `${startHeight}px`;
    galleryExpanded = true;
    renderGallery();
    galleryViewport.classList.add('is-expanded');
    galleryViewport.tabIndex = 0;
    requestAnimationFrame(() => {
      galleryViewport.style.height = `${Math.min(gallery.scrollHeight, startHeight + 180)}px`;
      galleryViewport.focus({ preventScroll: true });
      galleryViewport.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  galleryViewport.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !galleryExpanded || lightbox.style.display === 'block') return;
    event.preventDefault();
    collapseGallery();
    more.focus();
  });

  close.addEventListener('click', () => {
    document.body.style.overflow = '';
    lastFocusedItem?.focus();
  });
  lightbox.addEventListener('click', () => {
    if (lightbox.style.display === 'none') {
      document.body.style.overflow = '';
      lastFocusedItem?.focus();
    }
  });
  document.addEventListener('keydown', event => {
    if (lightbox.style.display !== 'block') return;
    if (event.key === 'Escape') {
      close.click();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      document.querySelector('.lightbox-prev').click();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      document.querySelector('.lightbox-next').click();
    } else if (event.key === 'Tab') {
      const controls = [close, document.querySelector('.lightbox-prev'), document.querySelector('.lightbox-next')];
      const position = controls.indexOf(document.activeElement);
      if (event.shiftKey && position <= 0) {
        event.preventDefault();
        controls[controls.length - 1].focus();
      } else if (!event.shiftKey && position === controls.length - 1) {
        event.preventDefault();
        controls[0].focus();
      }
    }
  });

  hamburger?.addEventListener('click', () => {
    hamburger.setAttribute('aria-expanded', String(document.querySelector('.nav-links').classList.contains('active')));
  });

  renderGallery();
});
