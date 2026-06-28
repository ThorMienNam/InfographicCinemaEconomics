/**
 * Cinema Economics — script.js
 * Handles: Pie Chart, Counter Animation, Scroll Reveal, Hover FX
 */

/* ══════════════════════════════════════
   PIE CHART ENGINE
   ══════════════════════════════════════ */

const PIE_DATA = [
  { label: 'Bắp & Nước',  value: 45, color: '#ff1f2d', hover: '#ff4a55' },
  { label: 'Bán Vé',      value: 40, color: '#ffd400', hover: '#ffe033' },
  { label: 'Quảng Cáo',   value: 10, color: '#e0e0e0', hover: '#f0f0f0' },
  { label: 'Khác',        value:  5, color: '#666666', hover: '#888888' },
];

let pieAnimProgress = 0;    // 0 → 1
let hoveredSlice    = -1;
let pieCanvas, pieCtx;
let animFrameId;
const PIE_ANIM_DURATION = 1600; // ms

function initPieChart() {
  pieCanvas = document.getElementById('pieChart');
  if (!pieCanvas) return;
  pieCtx = pieCanvas.getContext('2d');

  /* High-DPI rendering */
  const dpr = window.devicePixelRatio || 1;
  const size = 280;
  pieCanvas.width  = size * dpr;
  pieCanvas.height = size * dpr;
  pieCanvas.style.width  = size + 'px';
  pieCanvas.style.height = size + 'px';
  pieCtx.scale(dpr, dpr);

  pieCanvas.addEventListener('mousemove', onPieMouseMove);
  pieCanvas.addEventListener('mouseleave', () => { hoveredSlice = -1; drawPie(pieAnimProgress); });
  pieCanvas.addEventListener('click', onPieClick);
}

function startPieAnimation() {
  let start = null;
  function step(ts) {
    if (!start) start = ts;
    pieAnimProgress = Math.min((ts - start) / PIE_ANIM_DURATION, 1);
    /* Ease out cubic */
    const ease = 1 - Math.pow(1 - pieAnimProgress, 3);
    drawPie(ease);
    if (pieAnimProgress < 1) animFrameId = requestAnimationFrame(step);
  }
  animFrameId = requestAnimationFrame(step);
}

function drawPie(progress) {
  if (!pieCtx) return;
  const size   = 280;
  const cx     = size / 2;
  const cy     = size / 2;
  const outerR = 120;
  const innerR = 60;   /* donut hole */

  pieCtx.clearRect(0, 0, size, size);

  /* Draw glow ring behind */
  const glow = pieCtx.createRadialGradient(cx, cy, innerR, cx, cy, outerR + 10);
  glow.addColorStop(0, 'transparent');
  glow.addColorStop(1, 'rgba(255,31,45,0.08)');
  pieCtx.beginPath();
  pieCtx.arc(cx, cy, outerR + 6, 0, Math.PI * 2);
  pieCtx.fillStyle = glow;
  pieCtx.fill();

  let startAngle = -Math.PI / 2; /* 12 o'clock */
  const totalAngle = Math.PI * 2 * progress;
  let sliceAngles = [];

  PIE_DATA.forEach((slice, i) => {
    const sliceFraction = slice.value / 100;
    const sliceAngle    = totalAngle * sliceFraction;
    const endAngle      = startAngle + sliceAngle;
    const isHovered     = hoveredSlice === i;
    const pullOut       = isHovered ? 10 : 0;
    const midAngle      = startAngle + sliceAngle / 2;

    sliceAngles.push({ start: startAngle, end: endAngle, mid: midAngle });

    /* Offset hovered slice */
    const ox = Math.cos(midAngle) * pullOut;
    const oy = Math.sin(midAngle) * pullOut;

    const r = isHovered ? outerR + 8 : outerR;

    /* Shadow for hovered */
    if (isHovered) {
      pieCtx.save();
      pieCtx.shadowColor = slice.color;
      pieCtx.shadowBlur  = 20;
    }

    /* Slice path */
    pieCtx.beginPath();
    pieCtx.moveTo(cx + ox + Math.cos(startAngle) * innerR,
                  cy + oy + Math.sin(startAngle) * innerR);
    pieCtx.arc(cx + ox, cy + oy, r, startAngle, endAngle);
    pieCtx.arc(cx + ox, cy + oy, innerR, endAngle, startAngle, true);
    pieCtx.closePath();
    pieCtx.fillStyle = isHovered ? slice.hover : slice.color;
    pieCtx.fill();

    if (isHovered) pieCtx.restore();

    /* Gap line */
    pieCtx.beginPath();
    pieCtx.moveTo(cx + ox, cy + oy);
    pieCtx.lineTo(cx + ox + Math.cos(startAngle) * (r + 2),
                  cy + oy + Math.sin(startAngle) * (r + 2));
    pieCtx.strokeStyle = '#111';
    pieCtx.lineWidth   = 2;
    pieCtx.stroke();

    startAngle = endAngle;
  });

  /* Percentage labels (only after animation is far enough) */
  if (progress > 0.5) {
    const labelOpacity = (progress - 0.5) * 2;
    pieCtx.save();
    pieCtx.globalAlpha = labelOpacity;
    sliceAngles.forEach((angles, i) => {
      const slice = PIE_DATA[i];
      const labelR = outerR * 0.72;
      const lx = cx + Math.cos(angles.mid) * labelR;
      const ly = cy + Math.sin(angles.mid) * labelR;
      pieCtx.fillStyle = i < 2 ? '#111' : '#fff';
      pieCtx.font      = 'bold 11px Montserrat, sans-serif';
      pieCtx.textAlign = 'center';
      pieCtx.textBaseline = 'middle';
      pieCtx.fillText(slice.value + '%', lx, ly);
    });
    pieCtx.restore();
  }
}

function getPieSliceAt(x, y) {
  if (!pieCanvas) return -1;
  const size   = 280;
  const cx     = size / 2;
  const cy     = size / 2;
  const dx     = x - cx;
  const dy     = y - cy;
  const dist   = Math.sqrt(dx * dx + dy * dy);
  if (dist < 60 || dist > 140) return -1; /* outside donut ring */

  let angle = Math.atan2(dy, dx);
  if (angle < -Math.PI / 2) angle += Math.PI * 2;
  const offset = -Math.PI / 2;

  let start = offset < 0 ? offset + Math.PI * 2 : offset;
  for (let i = 0; i < PIE_DATA.length; i++) {
    const span = (PIE_DATA[i].value / 100) * Math.PI * 2;
    let end = start + span;
    let a = angle < -Math.PI / 2 + 0.001 ? angle + Math.PI * 2 : angle;
    if (a >= start && a <= end) return i;
    start = end;
  }
  return -1;
}

function onPieMouseMove(e) {
  const rect = pieCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (280 / rect.width);
  const y = (e.clientY - rect.top)  * (280 / rect.height);
  const slice = getPieSliceAt(x, y);
  if (slice !== hoveredSlice) {
    hoveredSlice = slice;
    pieCanvas.style.cursor = slice >= 0 ? 'pointer' : 'default';
    drawPie(1);
  }
}

function onPieClick(e) {
  const rect = pieCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (280 / rect.width);
  const y = (e.clientY - rect.top)  * (280 / rect.height);
  const slice = getPieSliceAt(x, y);
  if (slice >= 0) {
    /* Highlight matching legend item */
    document.querySelectorAll('.legend-item').forEach((li, i) => {
      li.style.background = i === slice ? 'rgba(255,255,255,0.07)' : '';
    });
  }
}

/* Legend hover ↔ chart */
function bindLegend() {
  document.querySelectorAll('.legend-item').forEach((li, i) => {
    li.addEventListener('mouseenter', () => {
      hoveredSlice = i;
      drawPie(1);
    });
    li.addEventListener('mouseleave', () => {
      hoveredSlice = -1;
      drawPie(1);
    });
  });
}

/* ══════════════════════════════════════
   COUNTER ANIMATION
   ══════════════════════════════════════ */

function animateCounter(el, target, duration = 1800, suffix = '') {
  let start = null;
  const startVal = 0;
  function step(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    /* Ease out quad */
    const ease = 1 - (1 - progress) * (1 - progress);
    const current = Math.round(startVal + (target - startVal) * ease);
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

function triggerCounters(container) {
  container.querySelectorAll('[data-target]').forEach(el => {
    if (el.dataset.animated) return;
    el.dataset.animated = '1';
    const target = parseInt(el.dataset.target, 10);
    animateCounter(el, target);
  });
}

/* ══════════════════════════════════════
   SCROLL REVEAL + INTERSECTION OBSERVER
   ══════════════════════════════════════ */

let pieTriggered = false;

function initScrollReveal() {
  const options = {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;

      /* Delay support */
      const delay = parseInt(el.dataset.delay || 0, 10);
      setTimeout(() => {
        el.classList.add('visible');

        /* Trigger progress bars inside revealed cards */
        el.querySelectorAll('.rev-bar-fill').forEach(bar => {
          const targetWidth = bar.style.width;
          bar.style.width = '0';
          bar.style.setProperty('--target-width', targetWidth);
          requestAnimationFrame(() => {
            setTimeout(() => { bar.style.width = targetWidth; }, 100);
          });
        });

        /* Trigger counters */
        triggerCounters(el);

      }, delay);

      /* Pie chart trigger — when chart wrapper becomes visible */
      if (!pieTriggered && el.classList.contains('chart-wrapper')) {
        pieTriggered = true;
        setTimeout(startPieAnimation, delay + 200);
      }

      observer.unobserve(el);
    });
  }, options);

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ══════════════════════════════════════
   HERO KPI COUNTERS (triggered on load)
   ══════════════════════════════════════ */

function initHeroCounters() {
  document.querySelectorAll('.kpi-value').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    setTimeout(() => animateCounter(el, target, 2000), 1400);
  });
}

/* ══════════════════════════════════════
   SMOOTH SCROLL FOR ANCHORS
   ══════════════════════════════════════ */

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ══════════════════════════════════════
   PARALLAX HERO DECORATIONS (subtle)
   ══════════════════════════════════════ */

function initParallax() {
  const floats = document.querySelectorAll('.float-icon');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    floats.forEach((el, i) => {
      const factor = 0.08 + i * 0.04;
      el.style.transform = `translateY(${scrollY * factor}px)`;
    });
  }, { passive: true });
}

/* ══════════════════════════════════════
   COST BAR ANIMATION FIX
   (bars need CSS var approach)
   ══════════════════════════════════════ */

function initCostBars() {
  /* Already handled via CSS var(--w) + reveal.visible in CSS */
  /* Extra: animate on reveal */
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.cost-bar-fill').forEach(bar => {
        /* Trigger via re-triggering the CSS transition */
        bar.style.width = '0';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            bar.style.width = getComputedStyle(bar).getPropertyValue('--w').trim();
          });
        });
      });
      barObserver.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.cost-card').forEach(card => barObserver.observe(card));
}

/* ══════════════════════════════════════
   MARQUEE-STYLE SUMMARY KPI COUNTER
   ══════════════════════════════════════ */

function initSummaryCounters() {
  const opts = { threshold: 0.4 };
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      triggerCounters(entry.target);
      obs.unobserve(entry.target);
    });
  }, opts);

  document.querySelectorAll('.sum-kpi-val, .case-rate-value').forEach(el => {
    /* Wrap in observer target if needed */
    obs.observe(el.closest('section, .case-card') || el);
  });
}

/* ══════════════════════════════════════
   CASE RATE COUNTERS
   ══════════════════════════════════════ */

function initCaseRateCounters() {
  const opts = { threshold: 0.5 };
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.case-rate-value[data-target]').forEach(el => {
        if (el.dataset.animated) return;
        el.dataset.animated = '1';
        animateCounter(el, parseInt(el.dataset.target, 10), 1600);
      });
      obs.unobserve(entry.target);
    });
  }, opts);

  document.querySelectorAll('.case-card').forEach(card => obs.observe(card));
}

/* ══════════════════════════════════════
   REVENUE BAR ANIMATION
   ══════════════════════════════════════ */

function initRevBars() {
  /* Store original widths before reveal hides them */
  document.querySelectorAll('.rev-bar-fill').forEach(bar => {
    bar.dataset.origWidth = bar.style.width;
    bar.style.width = '0';
    bar.style.transition = 'width 1.4s cubic-bezier(0.23,1,0.32,1)';
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.rev-bar-fill').forEach(bar => {
        setTimeout(() => {
          bar.style.width = bar.dataset.origWidth || '0%';
        }, 400);
      });
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.rev-card').forEach(c => obs.observe(c));
}

/* ══════════════════════════════════════
   INIT
   ══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initPieChart();
  bindLegend();
  initHeroCounters();
  initScrollReveal();
  initSmoothScroll();
  initParallax();
  initCostBars();
  initSummaryCounters();
  initCaseRateCounters();
  initRevBars();

  /* Draw static pie until animation triggers */
  drawPie(0);
});
