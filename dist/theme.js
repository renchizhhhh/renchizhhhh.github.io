(() => {
  const root = document.documentElement;
  const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  let preference = null;
  try {
    const saved = localStorage.getItem('renchi-theme');
    if (saved === 'dark' || saved === 'light') preference = saved;
  } catch (_) { /* The toggle also works when browser storage is unavailable. */ }

  function apply(theme) {
    root.dataset.theme = theme;
    const button = document.querySelector('[data-theme-toggle]');
    if (!button) return;
    const zh = root.lang.startsWith('zh');
    const dark = theme === 'dark';
    button.textContent = zh ? (dark ? '浅色' : '深色') : (dark ? 'light' : 'dark');
    const label = zh ? (dark ? '切换至浅色模式' : '切换至深色模式') : (dark ? 'Switch to light mode' : 'Switch to dark mode');
    button.setAttribute('aria-label', label);
    button.title = label;
    button.hidden = false;
  }

  function setupLife() {
    const trigger = document.querySelector('[data-life-trigger]');
    const teaserMessage = document.querySelector('[data-life-message]');
    if (!trigger || !teaserMessage) return;
    const zh = root.lang.startsWith('zh');
    const copy = zh ? {
      title: '康威生命游戏',
      hint: '点击格子 · 空格暂停 · R 重置',
      canvas: '可编辑的康威生命游戏网格',
      pause: '暂停',
      play: '继续',
      reset: '重置',
      close: '关闭'
    } : {
      title: "Conway's Game of Life",
      hint: 'click cells · space pauses · R resets',
      canvas: "Editable Conway's Game of Life grid",
      pause: 'pause',
      play: 'play',
      reset: 'reset',
      close: 'close'
    };
    const teaserCopy = zh
      ? ['不要按这个按钮', '不要再按了', '看来你喜欢这个游戏？']
      : ['do not press this button', "don't press it again", 'looks like you like this game?'];

    const dialog = document.createElement('dialog');
    dialog.className = 'life-dialog';
    dialog.setAttribute('aria-labelledby', 'life-title');
    dialog.setAttribute('aria-describedby', 'life-hint');
    dialog.innerHTML = `<div class="life-shell">
      <div class="life-head"><div><h2 id="life-title">${copy.title}</h2><p id="life-hint">${copy.hint}</p></div><button type="button" class="life-close" data-life-close aria-label="${copy.close}">×</button></div>
      <canvas class="life-canvas" data-life-canvas width="336" height="216" tabindex="0" role="img" aria-label="${copy.canvas}"></canvas>
      <div class="life-actions"><button type="button" data-life-play>${copy.pause}</button><button type="button" data-life-reset>${copy.reset}</button></div>
    </div>`;
    document.body.appendChild(dialog);

    const canvas = dialog.querySelector('[data-life-canvas]');
    const context = canvas.getContext('2d');
    const playButton = dialog.querySelector('[data-life-play]');
    const cols = 42;
    const rows = 27;
    const cellSize = 8;
    let cells = new Uint8Array(cols * rows);
    let running = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    let lastStep = 0;
    let frame = 0;
    let previousFocus = null;

    function seed() {
      cells.fill(0);
      const cx = Math.floor(cols / 2) - 1;
      const cy = Math.floor(rows / 2) - 1;
      [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]].forEach(([x, y]) => {
        cells[(cy + y) * cols + cx + x] = 1;
      });
      [[0, 0], [1, 1], [1, 2], [0, 2], [-1, 2]].forEach(([x, y]) => {
        cells[(4 + y) * cols + 6 + x] = 1;
      });
    }

    function draw() {
      const styles = getComputedStyle(root);
      context.fillStyle = styles.getPropertyValue('--paper').trim();
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = styles.getPropertyValue('--line').trim();
      context.lineWidth = 1;
      context.beginPath();
      for (let x = 0; x <= cols; x += 1) {
        context.moveTo(x * cellSize + .5, 0);
        context.lineTo(x * cellSize + .5, rows * cellSize);
      }
      for (let y = 0; y <= rows; y += 1) {
        context.moveTo(0, y * cellSize + .5);
        context.lineTo(cols * cellSize, y * cellSize + .5);
      }
      context.stroke();
      context.fillStyle = styles.getPropertyValue('--blue').trim();
      cells.forEach((alive, index) => {
        if (!alive) return;
        const x = index % cols;
        const y = Math.floor(index / cols);
        context.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 1, cellSize - 1);
      });
    }

    function step() {
      const next = new Uint8Array(cells.length);
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          let neighbours = 0;
          for (let dy = -1; dy <= 1; dy += 1) {
            for (let dx = -1; dx <= 1; dx += 1) {
              if (dx === 0 && dy === 0) continue;
              const nx = (x + dx + cols) % cols;
              const ny = (y + dy + rows) % rows;
              neighbours += cells[ny * cols + nx];
            }
          }
          const alive = cells[y * cols + x];
          next[y * cols + x] = neighbours === 3 || (alive && neighbours === 2) ? 1 : 0;
        }
      }
      cells = next;
    }

    function updatePlayLabel() {
      playButton.textContent = running ? copy.pause : copy.play;
    }

    function animate(time) {
      if (!dialog.open) return;
      if (running && time - lastStep >= 135) {
        step();
        draw();
        lastStep = time;
      }
      frame = requestAnimationFrame(animate);
    }

    function openLife() {
      previousFocus = document.activeElement;
      seed();
      updatePlayLabel();
      draw();
      if (dialog.showModal) dialog.showModal();
      else dialog.setAttribute('open', '');
      canvas.focus();
      lastStep = performance.now();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(animate);
    }

    function closeLife() {
      cancelAnimationFrame(frame);
      if (dialog.close) dialog.close();
      else dialog.removeAttribute('open');
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    }

    let teaserStage = 0;
    trigger.addEventListener('click', () => {
      if (teaserStage < 2) {
        teaserStage += 1;
        trigger.dataset.eggStage = String(teaserStage);
        teaserMessage.textContent = teaserCopy[teaserStage];
        trigger.setAttribute('aria-label', teaserCopy[teaserStage]);
        return;
      }
      openLife();
    });
    dialog.querySelector('[data-life-close]').addEventListener('click', closeLife);
    dialog.querySelector('[data-life-reset]').addEventListener('click', () => {
      seed();
      draw();
      canvas.focus();
    });
    playButton.addEventListener('click', () => {
      running = !running;
      updatePlayLabel();
      canvas.focus();
    });
    canvas.addEventListener('pointerdown', event => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left) / rect.width * cols);
      const y = Math.floor((event.clientY - rect.top) / rect.height * rows);
      if (x >= 0 && x < cols && y >= 0 && y < rows) {
        cells[y * cols + x] = cells[y * cols + x] ? 0 : 1;
        draw();
      }
    });
    dialog.addEventListener('click', event => { if (event.target === dialog) closeLife(); });
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      closeLife();
    });
    dialog.addEventListener('keydown', event => {
      if (event.target instanceof HTMLButtonElement) return;
      if (event.code === 'Space') {
        event.preventDefault();
        running = !running;
        updatePlayLabel();
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        seed();
        draw();
      }
    });
    document.addEventListener('renchi-themechange', draw);
  }

  apply(preference || (media && media.matches ? 'dark' : 'light'));
  function ready() {
    apply(root.dataset.theme);
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection && navigator.connection.saveData;
    if (reduceMotion || saveData) {
      document.querySelectorAll('video[data-preview]').forEach(video => {
        video.removeAttribute('autoplay');
        video.pause();
      });
    }
    const button = document.querySelector('[data-theme-toggle]');
    if (button) button.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('renchi-theme', preference); } catch (_) {}
      apply(preference);
      document.dispatchEvent(new Event('renchi-themechange'));
    });
    setupLife();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
  const onSystemChange = event => { if (!preference) apply(event.matches ? 'dark' : 'light'); };
  if (media && media.addEventListener) media.addEventListener('change', onSystemChange);
  else if (media && media.addListener) media.addListener(onSystemChange);
})();
