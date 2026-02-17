// FRANCE — small UX helpers (no framework)

(function(){
  // Active nav state
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if(href === path) a.classList.add('active');
  });

  // Stat counter animation
  const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(prefersReduce) return;

  const els = Array.from(document.querySelectorAll('[data-count]'));
  if(!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(!e.isIntersecting) return;
      const el = e.target;
      io.unobserve(el);
      const target = Number(el.getAttribute('data-count') || '0');
      const suffix = el.getAttribute('data-suffix') || '';
      const prefix = el.getAttribute('data-prefix') || '';
      const decimals = Number(el.getAttribute('data-decimals') || '0');
      const duration = 850;
      const start = performance.now();

      function fmt(v){
        const fixed = v.toFixed(decimals);
        // add thin spaces for thousands
        const parts = fixed.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
        return prefix + parts.join('.') + suffix;
      }

      function tick(now){
        const t = Math.min(1, (now - start)/duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt(target * eased);
        if(t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, {threshold: 0.35});

  els.forEach(el => io.observe(el));
})();
