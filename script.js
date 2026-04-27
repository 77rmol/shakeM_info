const body = document.body;
const video = document.querySelector("#scroll-video");
const progressBar = document.querySelector("#video-progress");
const revealables = document.querySelectorAll("[data-reveal]");
const counters = document.querySelectorAll("[data-count]");
const menuToggle = document.querySelector(".menu-toggle");
const mobileNavPanel = document.querySelector("#mobile-nav-panel");
const mobileNavLinks = document.querySelectorAll(".mobile-nav a");
const mobileSectionToggles = document.querySelectorAll(".mobile-section-toggle");
const mobileSectionContents = document.querySelectorAll(".mobile-section-content");
const mobileCardToggles = document.querySelectorAll(".mobile-card-toggle");
const mobileCardContents = document.querySelectorAll(".mobile-card-content");
const zoomableImages = document.querySelectorAll("[data-lightbox]");
const lightbox = document.querySelector("#image-lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxCloseTargets = document.querySelectorAll("[data-lightbox-close]");

let videoReady = false;
let targetTime = 0;
let currentTime = 0;
const mobileMq = window.matchMedia("(max-width: 720px)");

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const formatCounter = (value, target) => {
  if (target >= 100) {
    return new Intl.NumberFormat("es-CO").format(Math.round(value));
  }

  return Math.round(value).toString();
};

const markVideoFallback = () => {
  body.classList.add("no-video");
};

const closeMobileMenu = () => {
  if (!menuToggle || !mobileNavPanel) {
    return;
  }

  menuToggle.setAttribute("aria-expanded", "false");
  mobileNavPanel.hidden = true;
  body.classList.remove("menu-open");
};

const toggleMobileMenu = () => {
  if (!menuToggle || !mobileNavPanel) {
    return;
  }

  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  mobileNavPanel.hidden = isOpen;
  body.classList.toggle("menu-open", !isOpen);
};

const closeMobileSections = () => {
  mobileSectionToggles.forEach((toggle) => {
    toggle.setAttribute("aria-expanded", "false");
  });

  mobileSectionContents.forEach((content) => {
    content.hidden = true;
  });
};

const closeMobileCards = () => {
  mobileCardToggles.forEach((toggle) => {
    toggle.setAttribute("aria-expanded", "false");
  });

  mobileCardContents.forEach((content) => {
    content.hidden = true;
  });
};

const syncMobileDisclosureState = () => {
  if (mobileMq.matches) {
    closeMobileSections();
    closeMobileCards();
    return;
  }

  mobileSectionToggles.forEach((toggle) => {
    toggle.setAttribute("aria-expanded", "true");
  });

  mobileSectionContents.forEach((content) => {
    content.hidden = false;
  });

  mobileCardToggles.forEach((toggle) => {
    toggle.setAttribute("aria-expanded", "true");
  });

  mobileCardContents.forEach((content) => {
    content.hidden = false;
  });
};

const revealWithin = (container) => {
  if (!container) {
    return;
  }

  container.querySelectorAll("[data-reveal]").forEach((node) => {
    node.classList.add("is-visible");
  });
};

const openLightbox = (image) => {
  if (!lightbox || !lightboxImage || !image) {
    return;
  }

  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt || "";
  lightbox.hidden = false;
  lightbox.setAttribute("aria-hidden", "false");
  body.classList.add("lightbox-open");
};

const closeLightbox = () => {
  if (!lightbox || !lightboxImage) {
    return;
  }

  lightbox.hidden = true;
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.src = "";
  lightboxImage.alt = "";
  body.classList.remove("lightbox-open");
};

const getScrollProgress = () => {
  const maxScroll = Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    1
  );

  return clamp(window.scrollY / maxScroll, 0, 1);
};

const syncVideoProgress = () => {
  const progress = getScrollProgress();

  if (progressBar) {
    progressBar.style.width = `${progress * 100}%`;
  }

  document.documentElement.style.setProperty(
    "--scroll-progress",
    progress.toFixed(4)
  );

  if (videoReady && Number.isFinite(video.duration) && video.duration > 0.1) {
    targetTime = progress * Math.max(video.duration - 0.08, 0.01);
  }
};

const animateVideo = () => {
  if (videoReady) {
    currentTime += (targetTime - currentTime) * 0.16;

    if (Math.abs(video.currentTime - currentTime) > 0.016) {
      video.currentTime = currentTime;
    }
  }

  requestAnimationFrame(animateVideo);
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.18 }
);

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const el = entry.target;
      const target = Number(el.dataset.count || 0);
      const duration = 1100;
      const start = performance.now();

      const tick = (now) => {
        const progress = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = formatCounter(target * eased, target);

        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  },
  { threshold: 0.6 }
);

revealables.forEach((node) => revealObserver.observe(node));
counters.forEach((node) => counterObserver.observe(node));

if (menuToggle && mobileNavPanel) {
  menuToggle.addEventListener("click", toggleMobileMenu);

  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) {
      closeMobileMenu();
    }
  });
}

mobileSectionToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const controls = toggle.getAttribute("aria-controls");
    const target = controls ? document.getElementById(controls) : null;

    if (!target || !mobileMq.matches) {
      return;
    }

    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    target.hidden = isOpen;

    if (!isOpen) {
      revealWithin(target);
    }
  });
});

mobileCardToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const controls = toggle.getAttribute("aria-controls");
    const target = controls ? document.getElementById(controls) : null;

    if (!target || !mobileMq.matches) {
      return;
    }

    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    target.hidden = isOpen;

    if (!isOpen) {
      revealWithin(target);
    }
  });
});

mobileMq.addEventListener("change", syncMobileDisclosureState);
syncMobileDisclosureState();

zoomableImages.forEach((image) => {
  image.addEventListener("click", () => openLightbox(image));
});

if (lightboxClose) {
  lightboxClose.addEventListener("click", closeLightbox);
}

lightboxCloseTargets.forEach((node) => {
  node.addEventListener("click", closeLightbox);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox && !lightbox.hidden) {
    closeLightbox();
  }
});

if (video) {
  video.addEventListener("loadedmetadata", () => {
    videoReady = Number.isFinite(video.duration) && video.duration > 0;

    if (!videoReady) {
      markVideoFallback();
      return;
    }

    video
      .play()
      .then(() => video.pause())
      .catch(() => {});

    video.currentTime = 0.01;
    currentTime = 0.01;
    syncVideoProgress();
  });

  video.addEventListener("error", markVideoFallback);

  window.setTimeout(() => {
    if (video.readyState < 1) {
      markVideoFallback();
    }
  }, 2200);
} else {
  markVideoFallback();
}

window.addEventListener("scroll", syncVideoProgress, { passive: true });
window.addEventListener("resize", syncVideoProgress);

syncVideoProgress();
animateVideo();
