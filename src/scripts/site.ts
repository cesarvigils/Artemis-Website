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

  /* Scroll lock. `overflow: hidden` on the root stops a wheel but not a
     touch drag that chains out of the panel, and it does not stop scripted
     scrolling either, so the reader closed the menu somewhere else on the
     page. Taking <body> out of flow at a negative offset freezes the
     position exactly, and restoring it puts them back where they were. */
  let lockedAt = 0;

  const lockScroll = (open: boolean) => {
    const body = document.body;
    if (open) {
      lockedAt = window.scrollY;
      body.style.position = 'fixed';
      body.style.top = `-${lockedAt}px`;
      body.style.insetInline = '0';
      return;
    }
    body.style.position = '';
    body.style.top = '';
    body.style.insetInline = '';
    window.scrollTo(0, lockedAt);
  };

  const setOpen = (open: boolean) => {
    const wasOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    document.documentElement.classList.toggle('menu-open', open);
    if (label) label.textContent = open ? 'Close menu' : 'Menu';
    if (open !== wasOpen) lockScroll(open);

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
   arriving from another page (/#scoreboard) jumps straight there instead of
   animating across several thousand pixels.
------------------------------------------------------------------- */
function initAnchors() {
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!link || link.target === '_blank') return;
    // Same document only: /#scoreboard from /team is a real navigation.
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

   Two things this is careful about, because a site built as a timing
   tower cannot ship a clock that is wrong:
   - The tick is scheduled to the next *minute boundary of the remaining
     time*, not to a free-running 30s interval, and it re-renders the
     moment the tab becomes visible again. A background tab throttles
     timers to a minute or more, so without that a reader coming back to
     the tab could read a value minutes old.
   - The line never swaps hard. It arrives once with a short fade and
     each new value fades up from 0.55, so the change is legible as a
     change without the text popping.
------------------------------------------------------------------- */
function inWords(diff: number): string {
  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `In ${days}d ${pad(hours)}h ${pad(mins)}m`;
}

function initCountdown() {
  const el = document.querySelector<HTMLElement>('[data-countdown]');
  if (!el) return;

  const target = Date.parse(el.dataset.countdown ?? '');
  if (Number.isNaN(target)) return;

  let timer = 0;
  let last = '';

  const DAY = 86400000;

  /* Zero state, and it depends on what the record knows.

     With a `startTime` the target IS the green flag, so the moment the
     countdown reaches zero the race is running and the line says so.

     Without one the target is midnight on the start date in the team's
     timezone, which means "Under way" at 6am on race morning would be a
     claim the clock cannot support. On the start date itself the line says
     "Race day"; only once that date has passed (the strip keeps an event
     until its end date does) does it say the race is running. */
  const exact = el.dataset.exact === 'true';

  const text = () => {
    const diff = target - Date.now();
    if (exact) return diff <= 0 ? 'Under way' : inWords(diff);
    if (diff <= -DAY) return 'Under way';
    if (diff <= 0) return 'Race day';
    return inWords(diff);
  };

  const fade = (from: number) => {
    if (reduceMotion.matches || typeof el.animate !== 'function') return;
    // Never from 0: an element that starts fully transparent is not a paint
    // candidate, and the site's rule is that nothing animates out of nothing.
    el.animate([{ opacity: from }, { opacity: 1 }], {
      duration: 200,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    });
  };

  const render = () => {
    const next = text();
    if (next === last) return next !== 'Under way';
    const first = last === '';
    last = next;
    el.textContent = next;
    el.hidden = false;
    fade(first ? 0.6 : 0.55);
    return next !== 'Under way';
  };

  const tick = () => {
    window.clearTimeout(timer);
    if (!render()) return;
    // The display changes when the remaining time crosses a minute
    // boundary, so wait exactly that long rather than a fixed interval.
    const remainder = (target - Date.now()) % 60000;
    timer = window.setTimeout(tick, remainder > 0 ? remainder : 60000);
  };

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tick();
  });

  tick();
}

/* Green-flag time, in the reader's own zone ---------------------------
   The markup carries the time in UTC, which is true everywhere and needs
   no clock. This rewrites it in the visitor's zone with the zone's short
   name, and prints the local date as well whenever the conversion lands
   on a different day from the one the strip is showing - otherwise a
   reader in Auckland sees "25 SEP" beside an 03:15 that is really the
   26th.
------------------------------------------------------------------- */
function initLocalTime() {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-local-time]'));
  if (!nodes.length || typeof Intl?.DateTimeFormat !== 'function') return;

  for (const el of nodes) {
    const iso = el.dataset.localTime ?? '';
    const when = new Date(iso);
    if (Number.isNaN(when.getTime())) continue;

    try {
      const localDay = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(when);
      const sameDay = localDay === iso.slice(0, 10);

      const text = new Intl.DateTimeFormat(undefined, {
        ...(sameDay ? {} : { day: '2-digit', month: 'short' }),
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }).format(when);

      if (text) el.textContent = text;
    } catch {
      /* A locale Intl cannot resolve leaves the UTC statement in place,
         which is the whole reason it is the thing in the markup. */
    }
  }
}

/* Sticky action bar, phones only --------------------------------------
   Shown once the first screen has scrolled away, hidden again when the
   footer is in view (it carries the same links) and while the menu is
   open (CSS handles that one, because the panel's own class is the
   condition). Two observers, no scroll listener, and the bar is
   `position: fixed` from the first frame, so it can never move the
   document: measured CLS 0.
------------------------------------------------------------------- */
function initStickyCta() {
  const bar = document.querySelector<HTMLElement>('[data-sticky-cta]');
  if (!bar || !('IntersectionObserver' in window)) return;

  const firstScreen = document.querySelector('.hero, .page-head');
  const footer = document.querySelector('.site-footer');
  if (!firstScreen || !footer) return;

  let firstScreenGone = false;
  let footerInView = false;

  /* The bar and the compact header CTA are the same action, so exactly one
     of them is on screen at a time: two Signal-filled buttons in one phone
     viewport spends the colour budget twice on one intent. Hiding the header
     copy costs no layout - the hamburger is already flush right and the
     wordmark is already flush left - so nothing moves when it goes. */
  const apply = () => {
    const shown = firstScreenGone && !footerInView;
    bar.classList.toggle('is-shown', shown);
    document.documentElement.classList.toggle('sticky-shown', shown);
  };

  new IntersectionObserver(
    ([entry]) => {
      firstScreenGone = !entry.isIntersecting;
      apply();
    },
    { threshold: 0 }
  ).observe(firstScreen);

  new IntersectionObserver(
    ([entry]) => {
      footerInView = entry.isIntersecting;
      apply();
    },
    { threshold: 0 }
  ).observe(footer);
}

/* Hero position marker ------------------------------------------------
   The site's signature moment, and the only new one. The marker counts
   from the field size down to the finishing position - P41 to P2 - eased
   like a timing tower resolving a result, and the podium rule beneath it
   is drawn by CSS the moment the number settles.

   Everything here is an enhancement of finished markup: the real position
   is already rendered, the glyph this touches is `aria-hidden` with the
   value repeated as text beside it, and the field is reserved at its
   widest so counting cannot shift the row. If the module runs late, the
   tab is hidden, motion is reduced, or the record carries no field size,
   the count is skipped and the marker is simply correct.
------------------------------------------------------------------- */
function initHeroCount() {
  const el = document.querySelector<HTMLElement>('[data-pos-to][data-pos-from]');
  const value = el?.querySelector<HTMLElement>('.hero-pos-value');
  if (!el || !value) return;

  const to = Number(el.dataset.posTo);
  const from = Number(el.dataset.posFrom);
  if (!Number.isFinite(to) || !Number.isFinite(from) || from <= to) return;
  if (reduceMotion.matches || document.hidden) return;

  const DELAY = 160;
  const DURATION = 420;

  // The rule under the number is a CSS animation on the document timeline
  // with a fixed delay. If this module is already past that point there is
  // nothing to be in step with, so the count is dropped rather than played
  // out of order.
  const now = Number(document.timeline?.currentTime ?? performance.now());
  if (!Number.isFinite(now) || now > DELAY + DURATION - 100) return;

  value.textContent = `P${from}`;

  const run = (start: number) => {
    const frame = (stamp: number) => {
      const t = Math.min(1, (stamp - start) / DURATION);
      // Exponential ease-out: the same shape as --ease-out-expo, so the
      // number decelerates the way everything else on the site does.
      const eased = t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
      value.textContent = `P${Math.round(from + (to - from) * eased)}`;
      if (t < 1) requestAnimationFrame(frame);
      else value.textContent = `P${to}`;
    };
    requestAnimationFrame(frame);
  };

  window.setTimeout(() => {
    if (document.hidden) {
      value.textContent = `P${to}`;
      return;
    }
    run(performance.now());
  }, Math.max(0, DELAY - now));
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
  // The thumb's width only changes when the viewport or the content does.
  // It was being written on every frame of every scroll, to the value it
  // already held - a layout-driving property inside a scroll handler.
  let lastWidth = '';

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
      const width = `${(visible * 100).toFixed(3)}%`;
      if (width !== lastWidth) {
        progress.style.width = width;
        lastWidth = width;
      }
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

  /* Step to the next slide's own snap position, not by a fixed amount.
     This used to take the *first* slide's width plus a hard-coded 32px gap
     and scroll by that every time, for slides of three different widths
     (276 / 614 / 806) and a real gap of 24. It landed correctly only
     because Chrome resolves mandatory snap in the direction of travel; a
     browser that snapped to the nearest point would have left one press
     moving nothing. */
  const step = (direction: 1 | -1) => {
    const slides = Array.from(track.querySelectorAll<HTMLElement>('.garage-slide'));
    if (!slides.length) return;

    /* The stops are measured against the first slide rather than against the
       computed `scroll-padding-inline-start`. The track's scroll padding and
       the list's inline padding are the same CSS expression on purpose (the
       strip lines up with the container gutter, not the viewport edge), so
       the first slide *is* scrollLeft 0 - and reading it that way avoids
       `getComputedStyle` on a `max()` with a percentage in it, which Chrome
       hands back unresolved. Parsing that gave a pad of 0, which put every
       stop 76px past its own snap point, and mandatory snap then pulled the
       track straight back: six presses, zero pixels. */
    const origin = slides[0].offsetLeft;
    const stops = slides.map((slide) => slide.offsetLeft - origin);
    const here = track.scrollLeft;
    const max = track.scrollWidth - track.clientWidth;
    const target =
      direction === 1
        ? stops.find((stop) => stop > here + 4)
        : [...stops].reverse().find((stop) => stop < here - 4);

    track.scrollTo({
      left: Math.max(0, Math.min(max, target ?? (direction === 1 ? max : 0))),
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
  initLocalTime();
  initCountdown();
  initHeroCount();
  initGarage();
  initStickyCta();
  initYear();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
