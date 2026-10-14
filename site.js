document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("site-menu");
  const serviceToggle = document.querySelector(".services-toggle");
  const serviceMenu = document.getElementById("service-menu");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileLayout = window.matchMedia("(max-width: 800px)");
  const transitions = new Map();

  // Keep the current visual height when a user reverses a transition.
  function transitionPanel(element, open, setVisible, slide = false) {
    const height = element.getBoundingClientRect().height;
    const opacity = getComputedStyle(element).opacity;
    transitions.get(element)?.cancel();
    transitions.delete(element);
    element.inert = !open;
    if (open) setVisible(true);
    const finish = () => {
      setVisible(open);
      element.style.overflow = "";
      transitions.delete(element);
    };
    if (reducedMotion.matches) {
      finish();
      return;
    }
    const targetHeight = open ? element.getBoundingClientRect().height : 0;
    element.style.overflow = "hidden";
    const animation = element.animate(
      [
        {
          height: height + "px",
          opacity: height ? opacity : 0,
          transform: slide && !height ? "translateY(-8px)" : "translateY(0)",
        },
        {
          height: targetHeight + "px",
          opacity: open ? 1 : 0,
          transform: slide && !open ? "translateY(-8px)" : "translateY(0)",
        },
      ],
      { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
    transitions.set(element, animation);
    animation.onfinish = finish;
  }
  function setServices(open) {
    if ((serviceToggle.getAttribute("aria-expanded") === "true") === open)
      return;
    serviceToggle.setAttribute("aria-expanded", String(open));
    transitionPanel(
      serviceMenu,
      open,
      (visible) => {
        serviceMenu.hidden = !visible;
      },
      !mobileLayout.matches,
    );
  }
  function setMenu(open) {
    const previous = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute(
      "aria-label",
      open ? "Tutup menu navigasi" : "Buka menu navigasi",
    );
    if (!mobileLayout.matches) {
      transitions.get(menu)?.cancel();
      transitions.delete(menu);
      menu.style.overflow = "";
      menu.classList.remove("is-open");
      menu.inert = false;
    } else if (previous !== open) {
      transitionPanel(
        menu,
        open,
        (visible) => menu.classList.toggle("is-open", visible),
        true,
      );
    } else if (!open && !transitions.has(menu)) {
      menu.inert = true;
    }
    if (!open) setServices(false);
  }
  menuToggle.addEventListener("click", () =>
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true"),
  );
  serviceToggle.addEventListener("click", () =>
    setServices(serviceToggle.getAttribute("aria-expanded") !== "true"),
  );
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".services-menu")) setServices(false);
    if (!event.target.closest(".site-header")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (serviceToggle.getAttribute("aria-expanded") === "true") {
      setServices(false);
      serviceToggle.focus();
    } else if (menuToggle.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuToggle.focus();
    }
  });
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document
    .querySelector(".services-menu")
    .addEventListener("focusout", (event) => {
      if (!event.currentTarget.contains(event.relatedTarget))
        setServices(false);
    });
  mobileLayout.addEventListener("change", () => {
    for (const animation of transitions.values()) animation.finish();
    setMenu(false);
  });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches)
      for (const animation of transitions.values()) animation.finish();
  });
  setMenu(false);

  // Preserve native details semantics and keyboard activation while animating height.
  document.querySelectorAll("details").forEach((details) => {
    const summary = details.querySelector("summary");
    let animation;
    let expanded = details.open;
    summary.addEventListener("click", (event) => {
      if (event.target.closest("a, button, input")) return;
      event.preventDefault();
      expanded = !expanded;
      const startHeight = details.getBoundingClientRect().height;
      animation?.cancel();
      details.open = true;
      const endHeight = expanded
        ? details.getBoundingClientRect().height
        : summary.getBoundingClientRect().height + 1;
      const finish = () => {
        details.open = expanded;
        details.style.overflow = "";
        animation = null;
      };
      if (reducedMotion.matches) {
        finish();
        return;
      }
      details.style.overflow = "hidden";
      animation = details.animate(
        [{ height: startHeight + "px" }, { height: endHeight + "px" }],
        { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
      animation.onfinish = finish;
    });
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) animation?.finish();
    });
  });

  const number = (id) => {
    const value = Number.parseFloat(document.getElementById(id)?.value);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  };
  const rupiah = (value) => "Rp " + Math.round(value).toLocaleString("id-ID");
  const contactHref = (service, message) =>
    `contact?service=${service}&message=${encodeURIComponent(message)}`;
  const buyLink = document.getElementById("buy-estimate-chat");
  if (buyLink) {
    const updateBuyLink = () => {
      calculateJastip();
      const method = document.getElementById("calc-method");
      buyLink.href = contactHref(
        "checkout",
        `Saya ingin titip beli barang senilai ${number("calc-rmb")} RMB, perkiraan berat ${number("calc-kg")} kg, via ${method.options[method.selectedIndex].text}. Estimasi website: ${document.getElementById("res-total").textContent}. Mohon konfirmasi totalnya.`,
      );
    };
    ["calc-rmb", "calc-kg", "calc-method"].forEach((id) =>
      document.getElementById(id).addEventListener("input", updateBuyLink),
    );
    updateBuyLink();
  }

  if (document.getElementById("display-live-rate")) {
    initTopupPage();
    const updateTopupLink = () => {
      calculateTopup();
      document.getElementById("topup-estimate-chat").href = contactHref(
        "topup",
        `Saya ingin top-up ${number("topup-rmb")} RMB. Mohon konfirmasi rate dan total transfernya.`,
      );
    };
    document
      .getElementById("topup-rmb")
      .addEventListener("input", updateTopupLink);
    document.querySelectorAll("[data-topup]").forEach((button) =>
      button.addEventListener("click", () => {
        document.getElementById("topup-rmb").value = button.dataset.topup;
        updateTopupLink();
      }),
    );
    updateTopupLink();
  }

  const volumeMethod = document.getElementById("volume-method");
  if (volumeMethod) {
    const updateVolume = () => {
      const divisor = volumeMethod.value === "handcarry" ? 2000 : 4000;
      const actual = number("volume-actual");
      const volume =
        (number("volume-length") *
          number("volume-width") *
          number("volume-height")) /
        divisor;
      const billable = Math.max(actual, volume);
      const rate = { handcarry: 300000, air: 220000, sea: 120000 }[
        volumeMethod.value
      ];
      const kg = (value) =>
        value.toLocaleString("id-ID", { maximumFractionDigits: 2 }) + " kg";
      document.getElementById("volume-actual-result").textContent = kg(actual);
      document.getElementById("volume-result").textContent = kg(volume);
      document.getElementById("volume-billable").textContent = kg(billable);
      document.getElementById("volume-cost").textContent = rupiah(
        billable * rate,
      );
    };
    [
      "volume-length",
      "volume-width",
      "volume-height",
      "volume-actual",
      "volume-method",
    ].forEach((id) =>
      document.getElementById(id).addEventListener("input", updateVolume),
    );
    updateVolume();
  }

  const faqSearch = document.getElementById("faq-search");
  if (faqSearch) {
    const questions = Array.from(
      document.querySelectorAll("[data-faq-category]"),
    );
    const filters = Array.from(document.querySelectorAll("[data-faq-filter]"));
    let category = "all";
    const filterQuestions = () => {
      const query = faqSearch.value.trim().toLocaleLowerCase("id-ID");
      let visible = 0;
      questions.forEach((question) => {
        question.hidden =
          (category !== "all" && question.dataset.faqCategory !== category) ||
          !question.textContent.toLocaleLowerCase("id-ID").includes(query);
        if (!question.hidden) visible++;
      });
      document.getElementById("faq-count").textContent =
        `${visible} pertanyaan${query ? " ditemukan" : ""}`;
      document.getElementById("faq-empty").hidden = visible > 0;
    };
    faqSearch.addEventListener("input", filterQuestions);
    filters.forEach((button) =>
      button.addEventListener("click", () => {
        category = button.dataset.faqFilter;
        filters.forEach((filter) =>
          filter.setAttribute("aria-pressed", String(filter === button)),
        );
        filterQuestions();
      }),
    );
    document.getElementById("faq-reset").addEventListener("click", () => {
      faqSearch.value = "";
      filters[0].click();
      faqSearch.focus();
    });
    filterQuestions();
  }

  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    const query = new URLSearchParams(window.location.search);
    const selected = Array.from(
      document.getElementById("contact-layanan").options,
    ).find((option) => option.dataset.service === query.get("service"));
    if (selected) selected.selected = true;
    document.getElementById("contact-pesan").value = (
      query.get("message") || ""
    ).slice(0, 3000);
    const updatePreview = () =>
      (document.getElementById("contact-preview").textContent =
        getContactMessage());
    contactForm.addEventListener("input", updatePreview);
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      sendContactForm();
    });
    updatePreview();
  }
});
