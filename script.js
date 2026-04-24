const body = document.body;
const video = document.querySelector("#scroll-video");
const progressBar = document.querySelector("#video-progress");
const revealables = document.querySelectorAll("[data-reveal]");
const counters = document.querySelectorAll("[data-count]");

let videoReady = false;
let targetTime = 0;
let currentTime = 0;

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
