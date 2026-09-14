/* ------------------------------------------------------------------
   Artemis Esports - all client behaviour, one file.

   Rules this file follows:
   - Nothing here is required to see content. Every feature enhances
     markup that already renders and reads correctly without JS.
   - No window scroll listener. Sticky/reveal state comes from
     IntersectionObserver; the one scroll listener is passive and
     attached to the garage track itself (native carousel position).
   - Motion is opt-out aware via prefers-reduced-motion.
------------------------------------------------------------------- */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* Reveal on scroll -------------------------------------------------- */
function initReveals() {
  const items = document.querySelectorAll<HTMLElement>('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in-view'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );

  items.forEach((el) => io.observe(el));
}

/* Nav: solid background once the page has left the top --------------- */
function initNavState() {
  const nav = document.querySelector<HTMLElement>('.site-nav');
  const sentinel = document.querySelector<HTMLElement>('[data-nav-sentinel]');
  if (!nav || !sentinel || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(
    ([entry]) => nav.classList.toggle('is-stuck', !entry.isIntersecting),
    { threshold: 0 }
  );
  io.observe(sentinel);
}

/* Mobile menu -------------------------------------------------------- */
function initMenu() {
  const toggle = document.querySelector<HTMLButtonElement>('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    document.documentElement.classList.toggle('menu-open', open);
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menu.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    setOpen(false);
    toggle.focus();
  });

  const desktop = window.matchMedia('(min-width: 821px)');
  desktop.addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}

/* Next race countdown ------------------------------------------------
   The date is already in the markup as text. This only adds the
   "how long from now" line, which is meaningless without a clock.
------------------------------------------------------------------- */
function initCountdown() {
  const el = document.querySelector<HTMLElement>('[data-countdown]');
  if (!el) return;

  const target = Date.parse(el.dataset.countdown ?? '');
  if (Number.isNaN(target)) return;

  const render = () => {
    const diff = target - Date.now();
    if (diff <= 0) {
      el.textContent = 'Under way';
      el.hidden = false;
      return false;
    }
    const minutes = Math.floor(diff / 60000);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    el.textContent = `In ${days}d ${pad(hours)}h ${pad(mins)}m`;
    el.hidden = false;
    return true;
  };

  if (render()) window.setInterval(render, 30000);
}

/* Garage: native scroll-snap carousel --------------------------------
   The track scrolls natively on every device. The buttons and the
   progress line only describe that scroll; they never drive it from
   the page's own scroll position (no pinning, no scroll-jacking).
------------------------------------------------------------------- */
function initGarage() {
  const track = document.querySelector<HTMLElement>('[data-garage-track]');
  if (!track) return;

  const prev = document.querySelector<HTMLButtonElement>('[data-garage-prev]');
  const next = document.querySelector<HTMLButtonElement>('[data-garage-next]');
  const progress = document.querySelector<HTMLElement>('[data-garage-progress]');
  const controls = document.querySelector<HTMLElement>('[data-garage-controls]');

  let frame = 0;

  const update = () => {
    frame = 0;
    const max = track.scrollWidth - track.clientWidth;
    const ratio = max > 4 ? Math.min(1, Math.max(0, track.scrollLeft / max)) : 0;
    if (progress) progress.style.transform = `scaleX(${ratio || 0.001})`;
    if (prev) prev.disabled = track.scrollLeft < 8;
    if (next) next.disabled = track.scrollLeft > max - 8;
    if (controls) controls.hidden = max <= 4;
  };

  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(update);
  };

  const step = (direction: 1 | -1) => {
    const slide = track.querySelector<HTMLElement>('.garage-slide');
    const amount = slide ? slide.getBoundingClientRect().width + 32 : track.clientWidth * 0.8;
    track.scrollBy({
      left: direction * amount,
      behavior: reduceMotion.matches ? 'auto' : 'smooth',
    });
  };

  prev?.addEventListener('click', () => step(-1));
  next?.addEventListener('click', () => step(1));
  track.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  update();
}

/* Footer year -------------------------------------------------------
   The markup carries the build year so the page is never wrong-looking
   without JS; this corrects it after a New Year with no rebuild.
------------------------------------------------------------------- */
function initYear() {
  const el = document.querySelector<HTMLElement>('[data-year]');
  if (el) el.textContent = String(new Date().getFullYear());
}

function init() {
  initReveals();
  initNavState();
  initMenu();
  initCountdown();
  initGarage();
  initYear();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
