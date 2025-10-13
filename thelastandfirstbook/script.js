// Make words clickable/animatable, show Next after 3 gone.
// Works even if prefers-reduced-motion is ON.

(function () {
  const poemEl = document.getElementById('poem');
  const nextBtn = document.getElementById('nextBtn');
  if (!poemEl) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Build word spans
  const text = poemEl.textContent;
  poemEl.textContent = '';
  const tokens = text.split(/(\s+|\n)/);

  let goneCount = 0;

  const markGone = () => {
    goneCount += 1;
    if (goneCount >= 3) {
      nextBtn.classList.add('show');
      nextBtn.setAttribute('aria-hidden', 'false');
    }
  };

  tokens.forEach(tok => {
    if (tok === '\n') {
      poemEl.appendChild(document.createElement('br'));
      return;
    }
    if (/^\s+$/.test(tok)) {
      poemEl.appendChild(document.createTextNode(' '));
      return;
    }

    const span = document.createElement('span');
    span.className = 'w';
    span.textContent = tok;

    // tag burn/burning words specially
    if (/^burn(?:ing)?[.,;:!?"]?$/i.test(tok)) span.classList.add('burn');

    span.addEventListener('click', () => {
      if (span.dataset.gone === '1') return;

      // For motion users: animate and detect when finished.
      if (!prefersReduced) {
        const angle = (Math.random() * 240 - 120);
        const dist  = 200 + Math.random() * 220;
        const rad   = angle * Math.PI / 180;
        const tx    = Math.cos(rad) * dist;
        const ty    = Math.sin(rad) * dist - 120;
        const rz    = (Math.random() * 60 - 30) + 'deg';

        span.style.setProperty('--tx', `${tx.toFixed(1)}px`);
        span.style.setProperty('--ty', `${ty.toFixed(1)}px`);
        span.style.setProperty('--rz', rz);

        span.classList.add('flying');

        span.addEventListener('animationend', (e) => {
          if (e.animationName === 'fly') {
            span.style.visibility = 'hidden';
            span.dataset.gone = '1';
            markGone();
          }
        }, { once: true });
      } else {
        // Reduced motion: fade out quickly and count immediately.
        span.classList.add('flying');          // CSS makes it fade/scale
        setTimeout(() => {
          span.style.visibility = 'hidden';
          span.dataset.gone = '1';
          markGone();
        }, 260);
      }
    });

    poemEl.appendChild(span);
  });
})();