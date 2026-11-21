// input.js — one job: turn keyboard + mouse into a plain intent object
// the game loop can read. No game logic lives here.
export function createInput(canvas) {
  const keys = new Set();
  const clicks = []; // queued {x, y} in canvas coordinates, consumed by the loop
  let mouse = { x: 0, y: 0 };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
    Space: 'run',
  };

  function onKeyDown(e) {
    const action = KEYMAP[e.code];
    if (action) {
      keys.add(action);
      e.preventDefault();
    }
    if (e.code === 'KeyR') keys.add('restart');
    if (e.code === 'KeyM') keys.add('mute');
    if (e.code === 'Enter') keys.add('confirm');
  }
  function onKeyUp(e) {
    const action = KEYMAP[e.code];
    if (action) keys.delete(action);
  }
  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse = {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }
  function onMouseDown(e) {
    onMouseMove(e);
    clicks.push({ x: mouse.x, y: mouse.y });
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    // Movement vector, normalised, from whatever keys are held.
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('left')) x -= 1;
      if (keys.has('right')) x += 1;
      if (keys.has('up')) y -= 1;
      if (keys.has('down')) y += 1;
      if (x !== 0 && y !== 0) {
        const inv = 1 / Math.hypot(x, y);
        x *= inv;
        y *= inv;
      }
      return { x, y };
    },
    get sneaking() { return keys.has('sneak'); },
    get running() { return keys.has('run'); },
    get mouse() { return mouse; },
    takeClicks() { return clicks.splice(0, clicks.length); },
    // One-shot keys: reading them clears them.
    takeRestart() { const v = keys.has('restart'); keys.delete('restart'); return v; },
    takeMute() { const v = keys.has('mute'); keys.delete('mute'); return v; },
    takeConfirm() { const v = keys.has('confirm'); keys.delete('confirm'); return v; },
  };
}
