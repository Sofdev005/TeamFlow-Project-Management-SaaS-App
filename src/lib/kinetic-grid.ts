export interface KineticGridOptions {
  spacing?: number;
  radius?: number;
  pull?: number;
  rippleSpeed?: number;
  rippleWidth?: number;
  rippleStrength?: number;
  rippleDuration?: number;
  easing?: number;
  baseColor?: string;
  accentColor?: string;
}

interface GridPoint {
  hx: number;
  hy: number;
  x: number;
  y: number;
  intensity: number;
}

interface Ripple {
  x: number;
  y: number;
  time: number;
}

export function createKineticGrid(
  canvas: HTMLCanvasElement,
  options: KineticGridOptions = {}
) {
  const settings = {
    spacing: 48,
    radius: 220,
    pull: 0.38,
    rippleSpeed: 520,
    rippleWidth: 90,
    rippleStrength: 22,
    rippleDuration: 1.6,
    easing: 0.14,
    baseColor: '15,23,42',
    accentColor: '79,70,229',
    ...options,
  };

  const context = canvas.getContext('2d');
  if (!context) return { destroy() {} };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let columns = 0;
  let rows = 0;
  let pixelRatio = 1;
  let points: GridPoint[] = [];
  let ripples: Ripple[] = [];
  const pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0, active: 0, target: 0 };
  let animationFrame = 0;
  let lastFrame = performance.now();

  function resize() {
    const rect = canvas.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    columns = Math.ceil(width / settings.spacing) + 2;
    rows = Math.ceil(height / settings.spacing) + 2;
    const offsetX = (width - (columns - 1) * settings.spacing) / 2;
    const offsetY = (height - (rows - 1) * settings.spacing) / 2;

    points = [];
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const homeX = offsetX + column * settings.spacing;
        const homeY = offsetY + row * settings.spacing;
        points.push({ hx: homeX, hy: homeY, x: homeX, y: homeY, intensity: 0 });
      }
    }

    if (reduceMotion) draw();
  }

  function toLocal(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function isInside(point: { x: number; y: number }) {
    return point.x >= 0 && point.y >= 0 && point.x <= width && point.y <= height;
  }

  function onMove(event: PointerEvent) {
    const point = toLocal(event);
    if (!isInside(point)) {
      pointer.target = 0;
      return;
    }

    if (!pointer.active) {
      pointer.smoothX = point.x;
      pointer.smoothY = point.y;
    }
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.target = 1;
  }

  function onLeave() {
    pointer.target = 0;
  }

  function onClick(event: PointerEvent) {
    const point = toLocal(event);
    if (!isInside(point)) return;

    ripples.push({ x: point.x, y: point.y, time: 0 });
    if (ripples.length > 8) ripples.shift();
  }

  function step(deltaTime: number) {
    pointer.active += (pointer.target - pointer.active) * Math.min(1, deltaTime * 6);
    pointer.smoothX += (pointer.x - pointer.smoothX) * Math.min(1, deltaTime * 14);
    pointer.smoothY += (pointer.y - pointer.smoothY) * Math.min(1, deltaTime * 14);

    for (const ripple of ripples) ripple.time += deltaTime;
    ripples = ripples.filter((ripple) => ripple.time < settings.rippleDuration);

    for (const point of points) {
      let targetX = point.hx;
      let targetY = point.hy;
      let intensity = 0;

      if (pointer.active > 0.01) {
        const dx = pointer.smoothX - point.hx;
        const dy = pointer.smoothY - point.hy;
        const distance = Math.hypot(dx, dy);
        if (distance < settings.radius) {
          const proximity = 1 - distance / settings.radius;
          const force = proximity * proximity * settings.pull * pointer.active;
          targetX += dx * force;
          targetY += dy * force;
          intensity = Math.max(intensity, proximity * pointer.active);
        }
      }

      for (const ripple of ripples) {
        const dx = point.hx - ripple.x;
        const dy = point.hy - ripple.y;
        const distance = Math.hypot(dx, dy) || 0.0001;
        const delta = distance - ripple.time * settings.rippleSpeed;
        if (Math.abs(delta) < settings.rippleWidth) {
          const fade = 1 - ripple.time / settings.rippleDuration;
          const wave = Math.cos((delta / settings.rippleWidth) * Math.PI * 0.5) * fade;
          targetX += (dx / distance) * wave * settings.rippleStrength;
          targetY += (dy / distance) * wave * settings.rippleStrength;
          intensity = Math.max(intensity, wave);
        }
      }

      point.x += (targetX - point.x) * settings.easing;
      point.y += (targetY - point.y) * settings.easing;
      point.intensity += (intensity - point.intensity) * 0.2;
    }
  }

  function drawLine(start: GridPoint, end: GridPoint) {
    const intensity = (start.intensity + end.intensity) / 2;
    context.strokeStyle =
      intensity > 0.02
        ? `rgba(${settings.accentColor},${0.14 + intensity * 0.75})`
        : `rgba(${settings.baseColor},0.12)`;
    context.lineWidth = 1 + intensity * 0.6;
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }

  function draw() {
    context.clearRect(0, 0, width, height);

    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const point = points[row * columns + column];
        if (column < columns - 1) drawLine(point, points[row * columns + column + 1]);
        if (row < rows - 1) drawLine(point, points[(row + 1) * columns + column]);
      }
    }

    for (const point of points) {
      context.fillStyle =
        point.intensity > 0.02
          ? `rgba(${settings.accentColor},${0.5 + point.intensity * 0.5})`
          : `rgba(${settings.baseColor},0.24)`;
      context.beginPath();
      context.arc(point.x, point.y, 1.2 + point.intensity * 2, 0, Math.PI * 2);
      context.fill();
    }
  }

  function frame(now: number) {
    const deltaTime = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    step(deltaTime);
    draw();
    animationFrame = requestAnimationFrame(frame);
  }

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerdown', onClick);
  document.documentElement.addEventListener('pointerleave', onLeave);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();
  if (!reduceMotion) animationFrame = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onClick);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    },
  };
}