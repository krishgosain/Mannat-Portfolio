(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const body = document.body;
  body.dataset.theme = 'noir';

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    lenis.stop();
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const el = id === '#top' ? document.body : $(id);
    if (!el) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(el, { offset: 0, duration: 1.6 }) : el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ---------- loader ---------- */
  const loader = $('.loader'), count = $('.loader__count');
  const finish = () => {
    loader.classList.add('done');
    body.classList.remove('is-loading');
    lenis && lenis.start();
    setTimeout(() => $$('.cover .line-mask, .cover .clip').forEach(el => el.classList.add('is-in')), 250);
    setTimeout(() => loader.remove(), 1600);
  };
  if (reduce) { count.textContent = '100'; finish(); }
  else {
    const t0 = performance.now(), dur = 1700;
    let loaded = false;
    window.addEventListener('load', () => (loaded = true));
    setTimeout(() => (loaded = true), 4000);
    const tick = now => {
      let p = Math.min((now - t0) / dur, 1);
      if (!loaded) p = Math.min(p, 0.9);
      const e = 1 - Math.pow(1 - p, 3);
      count.textContent = Math.round(e * 100);
      p < 1 ? requestAnimationFrame(tick) : setTimeout(finish, 200);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- reveal on view ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    if (el.closest('.cover')) return;
    el.classList.add('is-in');
    if (el.matches('.line-mask')) {
      const sibs = $$('.line-mask', el.parentElement);
      el.firstElementChild.style.transitionDelay = (sibs.indexOf(el) * 0.1) + 's';
    }
    io.unobserve(el);
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.line-mask, .fade, .clip').forEach(el => io.observe(el));

  /* stagger fades inside grids */
  $$('.findings, .mix, .roles, .kit').forEach(g => $$('.fade', g).forEach((el, i) => (el.style.transitionDelay = (i % 6) * 0.08 + 's')));

  /* ---------- count-up ---------- */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, to = +el.dataset.count, t0 = performance.now();
    const step = now => {
      const p = Math.min((now - t0) / 1400, 1);
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3)))).padStart(2, '0');
      p < 1 && requestAnimationFrame(step);
    };
    reduce ? (el.textContent = String(to).padStart(2, '0')) : requestAnimationFrame(step);
    cio.unobserve(el);
  }), { threshold: 0.6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- section themes ---------- */
  const themed = $$('[data-theme]').filter(el => el !== body);
  const setTheme = () => {
    const mid = innerHeight * 0.5;
    for (const s of themed) {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) { if (body.dataset.theme !== s.dataset.theme) body.dataset.theme = s.dataset.theme; break; }
    }
  };

  /* ---------- scroll-linked: progress, parallax, reel bar ---------- */
  const bar = $('.progress');
  const par = $$('[data-speed]');
  const coverImg = $('.cover__img');
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    setTheme();
    if (reduce) return;
    par.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const c = r.top + r.height / 2 - innerHeight / 2;
      img.style.transform = `translate3d(0,${c * +img.dataset.speed}px,0)`;
    });
    if (coverImg && y < innerHeight * 1.2) {
      coverImg.style.transform = `translate(-50%, calc(-46% + ${y * 0.18}px)) scale(${1 + y * 0.0003})`;
    }
  };
  lenis ? lenis.on('scroll', onScroll) : addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- cursor ---------- */
  const cur = $('.cursor'), label = $('.cursor__label');
  if (fine && !reduce) {
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; }, { passive: true });
    const loop = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor]');
      if (t) { label.textContent = t.dataset.cursor; cur.classList.add('is-big'); }
    });
    document.addEventListener('pointerout', e => {
      const t = e.target.closest('[data-cursor]');
      if (t && !t.contains(e.relatedTarget)) cur.classList.remove('is-big');
    });
  } else cur.remove();

  /* ---------- contents: floating peek ---------- */
  const peek = $('.peek');
  if (fine) {
    let px = 0, py = 0, tx = 0, ty = 0, on = false;
    $$('.toc a').forEach(a => {
      a.addEventListener('pointerenter', () => {
        on = true; peek.classList.add('on');
        $$('img', peek).forEach(i => i.classList.toggle('on', i.dataset.k === a.dataset.peek));
      });
      a.addEventListener('pointerleave', () => { on = false; peek.classList.remove('on'); });
    });
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const ploop = () => {
      px += (tx - px) * 0.12; py += (ty - py) * 0.12;
      if (on || peek.classList.contains('on')) peek.style.left = '0', peek.style.translate = `${px + 30}px ${py - peek.offsetHeight / 2}px`;
      requestAnimationFrame(ploop);
    };
    ploop();
  } else peek.remove();

  /* ---------- drag reel ---------- */
  $$('[data-reel]').forEach(reel => {
    const thumb = reel.nextElementSibling && $('i', reel.nextElementSibling);
    let down = false, sx = 0, sl = 0, moved = 0, v = 0, last = 0;
    const upd = () => {
      if (!thumb) return;
      const max = reel.scrollWidth - reel.clientWidth;
      const w = Math.max(reel.clientWidth / reel.scrollWidth, 0.1);
      thumb.style.width = w * 100 + '%';
      thumb.style.left = (max > 0 ? reel.scrollLeft / max : 0) * (1 - w) * 100 + '%';
    };
    reel.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
    if (!fine) return;
    reel.addEventListener('pointerdown', e => { down = true; moved = 0; sx = e.clientX; sl = reel.scrollLeft; last = e.clientX; v = 0; });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx; moved = Math.abs(dx);
      if (moved > 4) reel.classList.add('dragging');
      reel.scrollLeft = sl - dx; v = e.clientX - last; last = e.clientX;
    });
    addEventListener('pointerup', () => {
      if (!down) return; down = false;
      setTimeout(() => reel.classList.remove('dragging'), 0);
      const glide = () => { if (Math.abs(v) < 0.5) return; reel.scrollLeft -= v; v *= 0.93; requestAnimationFrame(glide); };
      glide();
    });
    reel.addEventListener('click', e => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    $$('img', reel).forEach(i => i.draggable = false);
    reel.addEventListener('wheel', e => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) return;
      e.stopPropagation();
    }, { passive: true });
    reel.setAttribute('data-lenis-prevent-horizontal', '');
  });

  /* ---------- VERA phone ---------- */
  const phone = $('[data-phone]');
  if (phone) {
    const shots = $$('.phone__screens img', phone), dots = $$('.phone__dots i', phone), plabel = $('.phone__label', phone);
    const names = ['Welcome', 'Style personality', 'Budget range', 'Personalised AI styling', 'Today’s picks', 'Community picks'];
    let i = 0;
    const go = () => {
      const prev = shots[i]; i = (i + 1) % shots.length;
      prev.classList.remove('on'); prev.classList.add('out');
      setTimeout(() => prev.classList.remove('out'), 700);
      shots[i].classList.add('on');
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
      plabel.textContent = names[i];
    };
    phone.addEventListener('click', go);
    phone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    phone.dataset.cursor = 'Tap';
  }

  /* ---------- VERA launch steps ---------- */
  const copy = [
    ['Open on the fashion pain points the audience already recognises: nothing to wear, endless scrolling, styles that don’t fit.', 'Instagram · TikTok'],
    ['Teasers and styling conversations that hint at a smarter way to shop, without naming the product yet.', 'Teaser content · Styling talk'],
    ['Gradually reveal the personalised styling experience, and invite early interaction and feedback.', 'Founder-led communication'],
    ['Selected creators get early access and share real styling experiences with their audiences.', 'Creator-led storytelling'],
    ['A launch that feels native to where the audience already discovers fashion, built on organic momentum.', 'Community · Organic discovery']
  ];
  const steps = $$('.step'), panel = $('[data-panel]'), ptag = $('[data-panel-tag]'), stepsBox = $('.steps');
  const pick = n => {
    steps.forEach((s, k) => s.setAttribute('aria-selected', k === n));
    stepsBox.style.setProperty('--p', (n + 1) * 20 + '%');
    panel.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: reduce ? 1 : 600, easing: 'cubic-bezier(.16,1,.3,1)' });
    panel.textContent = copy[n][0]; ptag.textContent = copy[n][1];
  };
  steps.forEach((s, k) => {
    s.addEventListener('click', () => pick(k));
    s.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const n = (k + (e.key === 'ArrowRight' ? 1 : steps.length - 1)) % steps.length;
        steps[n].focus(); pick(n);
      }
    });
  });

  /* ---------- Miu Miu board: drag to rearrange ---------- */
  const board = $('[data-board]');
  if (board && matchMedia('(min-width: 901px)').matches) {
    let z = 10;
    $$('.board__pic', board).forEach(p => {
      const r = getComputedStyle(p).getPropertyValue('--r') || '0deg';
      p.style.transform = `rotate(${r})`;
      let sx, sy, ox, oy, dragging = false;
      p.addEventListener('pointerdown', e => {
        dragging = true; p.setPointerCapture(e.pointerId);
        sx = e.clientX; sy = e.clientY; ox = p.offsetLeft; oy = p.offsetTop;
        p.style.zIndex = ++z; p.style.transition = 'transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s';
        p.style.transform = 'rotate(0deg) scale(1.03)';
        p.style.boxShadow = '0 50px 90px -30px rgba(75,15,27,.6)';
      });
      p.addEventListener('pointermove', e => {
        if (!dragging) return;
        const bw = board.clientWidth, bh = board.clientHeight;
        const nx = Math.max(-40, Math.min(bw - p.offsetWidth + 40, ox + e.clientX - sx));
        const ny = Math.max(-40, Math.min(bh - p.offsetHeight + 40, oy + e.clientY - sy));
        p.style.left = nx + 'px'; p.style.top = ny + 'px';
      });
      const end = () => { if (!dragging) return; dragging = false; p.style.transform = `rotate(${r})`; p.style.boxShadow = ''; };
      p.addEventListener('pointerup', end); p.addEventListener('pointercancel', end);
      p.dataset.cursor = 'Drag';
    });
  } else if (board) { $('.board-hint') && ($('.board-hint').textContent = 'Moodboard'); }

  /* ---------- Trend signals ---------- */
  const sigs = $$('[data-s]'), views = $$('.signals__view img'), scap = $('.signals__cap');
  const sCopy = [
    'How people build and express a self online.',
    'Virtual try-ons and AR experiences changing how fashion is discovered.',
    'Owning digital goods, and the value audiences give them.',
    'Niche spaces where new behaviours start before going mainstream.',
    'New tools reshaping how consumers find and join culture.'
  ];
  const sel = n => {
    sigs.forEach((b, k) => b.setAttribute('aria-pressed', k === n));
    views.forEach((v, k) => v.classList.toggle('on', k === n));
    scap.textContent = sCopy[n];
  };
  sigs.forEach((b, k) => { b.addEventListener('click', () => sel(k)); if (fine) b.addEventListener('pointerenter', () => sel(k)); });

  /* ---------- content mix (touch: tap to open) ---------- */
  $$('.fmt').forEach(f => f.addEventListener('click', () => { const o = f.classList.contains('open'); $$('.fmt').forEach(x => x.classList.remove('open')); if (!o) f.classList.add('open'); }));

  /* ---------- copy email ---------- */
  const cp = $('[data-copy]');
  cp && cp.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(cp.dataset.copy); cp.textContent = 'Copied'; }
    catch { cp.textContent = 'Select & copy'; }
    setTimeout(() => (cp.textContent = 'Copy email'), 1800);
  });

  /* ---------- clock ---------- */
  const clock = $('[data-clock]');
  const tickClock = () => clock && (clock.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date()));
  tickClock(); setInterval(tickClock, 20000);
})();
