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

/* Reveal on scroll --------------------------------------------------
   `.reveal` only offsets an element by 12px; it never hides it. Even so
   the observer is deliberately eager, anything already scrolled past is
   settled up front, and a timer settles whatever is left, so a reveal
   can never be the reason something looks wrong.
------------------------------------------------------------------- */
function initReveals() {
  const items = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
  if (!items.length) return;

  const settle = (el: Element) => el.classList.add('in-view');

  if (!('IntersectionObserver' in window)) {
    items.forEach(settle);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        settle(entry.target);
        io.unobserve(entry.target);
      }
    },
    { threshold: 0, rootMargin: '0px 0px 10% 0px' }
  );

  // No geometry is read here on purpose: measuring every reveal before first
  // paint forced a full layout of a 5,000px page and was the single largest
  // main-thread cost on the home page. Deep links are covered by the timer.
  items.forEach((el) => io.observe(el));

  window.setTimeout(() => {
    document.querySelectorAll('.reveal:not(.in-view)').forEach(settle);
  }, 1500);
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

  const label = toggle.querySelector<HTMLElement>('.sr-only');
  const behind = [document.getElementById('main'), document.querySelector('.site-footer')];

  const focusables = () =>
    [toggle, ...menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')].filter(
      (el): el is HTMLElement => !!el
    );

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    document.documentElement.classList.toggle('menu-open', open);
    if (label) label.textContent = open ? 'Close menu' : 'Menu';

    // The panel covers the page; keep what is behind it out of the tab
    // order and out of the accessibility tree.
    for (const el of behind) {
      if (!el) continue;
      (el as HTMLElement & { inert: boolean }).inert = open;
      if (open) el.setAttribute('aria-hidden', 'true');
      else el.removeAttribute('aria-hidden');
    }

    if (open) menu.querySelector<HTMLElement>('a[href]')?.focus();
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menu.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (toggle.getAttribute('aria-expanded') !== 'true') return;

    if (event.key === 'Escape') {
      setOpen(false);
      toggle.focus();
      return;
    }

    if (event.key !== 'Tab') return;
    const stops = focusables();
    if (!stops.length) return;
    const first = stops[0];
    const last = stops[stops.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && (active === first || !active || !stops.includes(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const desktop = window.matchMedia('(min-width: 821px)');
  desktop.addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}

/* In-page anchors ---------------------------------------------------
   Smooth scrolling is applied per click rather than globally, so a link
   arriving from another page (/#results) jumps straight there instead of
   animating across several thousand pixels.
------------------------------------------------------------------- */
function initAnchors() {
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!link || link.target === '_blank') return;
    // Same document only: /#results from /team is a real navigation.
    if (link.pathname.replace(/\/+$/, '') !== location.pathname.replace(/\/+$/, '')) return;

    const id = link.hash.slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: reduceMotion.matches ? 'auto' : 'smooth',
      block: 'start',
    });
    history.pushState(null, '', `#${id}`);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
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
    // Every read first, then every write: mixing them re-forces layout on
    // each scroll frame.
    const scrollWidth = track.scrollWidth;
    const clientWidth = track.clientWidth;
    const left = track.scrollLeft;
    const max = scrollWidth - clientWidth;
    const ratio = max > 4 ? Math.min(1, Math.max(0, left / max)) : 0;
    const visible = scrollWidth > 0 ? Math.min(1, clientWidth / scrollWidth) : 1;

    if (progress) {
      // The thumb is as wide as the share of the strip on screen, and
      // travels the rest, so it reads as "you are here, this much is left".
      progress.style.width = `${(visible * 100).toFixed(3)}%`;
      progress.style.transform = `translateX(${(ratio * (1 / visible - 1) * 100).toFixed(3)}%)`;
    }
    if (prev) prev.disabled = left < 8;
    if (next) next.disabled = left > max - 8;
    // visibility, not `hidden`: the control row keeps its height either way,
    // so revealing the arrows never nudges the heading beside them.
    if (controls) controls.style.visibility = max > 4 ? 'visible' : 'hidden';
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
  // Measured after first paint, not before it: reading scrollWidth here
  // synchronously forces a full layout of the page ahead of the first frame.
  schedule();
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
  initAnchors();
  initCountdown();
  initGarage();
  initYear();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
