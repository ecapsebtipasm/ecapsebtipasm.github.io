// Split the poem into per-word spans, mark "burn"/"burning", attach interactions.
// After 3 words fly away, reveal the "next" button.

(function () {
  const poemEl = document.getElementById('poem');
  const nextBtn = document.getElementById('nextBtn');
  if (!poemEl) return;

  const text = poemEl.textContent; // preserve original
  poemEl.textContent = '';          // clear

  const tokens = text.split(/(\s+|\n)/); // keep spaces/newlines as tokens
  let flownCount = 0;

  tokens.forEach(tok => {
    if (tok === '\n') {
      const br = document.createElement('br');
      br.className = 'br';
      poemEl.appendChild(br);
      return;
    }

    // whitespace (space/tab/etc.)
    if (/^\s+$/.test(tok)) {
      poemEl.appendChild(document.createTextNode(' '));
      return;
    }

    // a word token
    const span = document.createElement('span');
    span.className = 'w';
    span.textContent = tok;

    // special styling for "burn"/"burning" (case-insensitive, punctuation-safe)
    if (/^burn(?:ing)?[.,;:!?"]?$/i.test(tok)) {
      span.classList.add('burn');
    }

    // hover color handled by CSS; click == fly away
    span.addEventListener('click', () => {
      if (span.classList.contains('flying')) return;

      // random flight vector
      const angle = (Math.random() * 240 - 120); // -120..120 deg spray
      const dist = 200 + Math.random() * 220;    // px
      const rad = angle * (Math.PI / 180);
      const tx = Math.cos(rad) * dist;
      const ty = Math.sin(rad) * dist - 120; // bias upward a bit
      const rz = (Math.random() * 60 - 30) + 'deg';

      span.style.setProperty('--tx', `${tx.toFixed(1)}px`);
      span.style.setProperty('--ty', `${ty.toFixed(1)}px`);
      span.style.setProperty('--rz', rz);

      span.classList.add('flying');

      span.addEventListener('animationend', (e) => {
        if (e.animationName === 'fly') {
          span.style.visibility = 'hidden';
          flownCount += 1;
          if (flownCount >= 3) {
            nextBtn.classList.add('show');
            nextBtn.setAttribute('aria-hidden', 'false');
          }
        }
      }, { once: false });
    });

    poemEl.appendChild(span);
  });
})();