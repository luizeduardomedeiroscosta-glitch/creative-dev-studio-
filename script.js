const cursor = document.getElementById("cursor");
const ring = document.getElementById("cursor-ring");
const lifeCanvas = document.getElementById("life-canvas");
const lifeCtx = lifeCanvas.getContext("2d");

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let ringX = mouseX;
let ringY = mouseY;
let cursorScale = 1;
let palette = ["#c8f135", "#5caaff", "#ff5c5c", "#ffcf5c", "#b45cf5", "#7fffd4", "#f7f7f2", "#202020"];
let typewriterTimer = null;
let typewriterPhrase = 0;
let typewriterLetter = 0;
let typewriterDeleting = false;
let currentImage = 0;

const gallery = [
  { name: "Neon motion", bg: "linear-gradient(135deg, #090909, #c8f135 48%, #5caaff)" },
  { name: "Grid azul", bg: "linear-gradient(135deg, #07131d, #17323a, #5caaff)" },
  { name: "Solar quente", bg: "linear-gradient(135deg, #f5a623, #ff5c5c, #2a1010)" },
  { name: "Glass premium", bg: "linear-gradient(135deg, #f8f8f8, #b45cf5, #111)" },
  { name: "Code room", bg: "linear-gradient(135deg, #111, #252525, #c8f135)" },
  { name: "Studio alive", bg: "linear-gradient(135deg, #5caaff, #ffcf5c, #111)" }
];

const presetPalettes = {
  studio: ["#c8f135", "#5caaff", "#ff5c5c", "#ffcf5c", "#b45cf5", "#7fffd4", "#f7f7f2", "#202020"],
  ocean: ["#05203c", "#0b4f6c", "#01baef", "#20bfcc", "#a7f3d0", "#f0fdfa", "#083344", "#38bdf8"],
  sunset: ["#2b0f1f", "#7f1d1d", "#dc2626", "#f97316", "#facc15", "#fed7aa", "#fb7185", "#581c87"],
  forest: ["#07130d", "#123524", "#1f6f43", "#6ab04c", "#badc58", "#f6e58d", "#95a985", "#2f3e2e"],
  candy: ["#ff70a6", "#ff9770", "#ffd670", "#e9ff70", "#70d6ff", "#b8b8ff", "#ffc6ff", "#ffffff"],
  luxury: ["#070707", "#171717", "#2f2a1f", "#806443", "#c6a15b", "#f4e7c5", "#7c2d12", "#d6d3d1"]
};

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

function animateCursor() {
  if (!cursor || !ring) return;
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  cursor.style.transform = `translate(${mouseX - 6}px, ${mouseY - 6}px) scale(${cursorScale})`;
  ring.style.transform = `translate(${ringX - 18}px, ${ringY - 18}px)`;
  requestAnimationFrame(animateCursor);
}

function bindCursorHover() {
  qsa("a, button, input, textarea").forEach((item) => {
    item.addEventListener("mouseenter", () => {
      cursorScale = 1.5;
      ring.style.width = "56px";
      ring.style.height = "56px";
    });
    item.addEventListener("mouseleave", () => {
      cursorScale = 1;
      ring.style.width = "36px";
      ring.style.height = "36px";
    });
  });
}

function resizeLifeCanvas() {
  lifeCanvas.width = window.innerWidth * devicePixelRatio;
  lifeCanvas.height = window.innerHeight * devicePixelRatio;
  lifeCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

const points = Array.from({ length: 54 }, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  vx: (Math.random() - 0.5) * 0.55,
  vy: (Math.random() - 0.5) * 0.55,
  r: 1 + Math.random() * 2
}));

function animateLifeCanvas() {
  lifeCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  points.forEach((point, index) => {
    point.x += point.vx;
    point.y += point.vy;

    if (point.x < 0 || point.x > window.innerWidth) point.vx *= -1;
    if (point.y < 0 || point.y > window.innerHeight) point.vy *= -1;

    const distanceMouse = Math.hypot(point.x - mouseX, point.y - mouseY);
    if (distanceMouse < 150) {
      point.x += (point.x - mouseX) * 0.006;
      point.y += (point.y - mouseY) * 0.006;
    }

    lifeCtx.beginPath();
    lifeCtx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
    lifeCtx.fillStyle = palette[index % palette.length];
    lifeCtx.fill();

    points.slice(index + 1).forEach((other) => {
      const distance = Math.hypot(point.x - other.x, point.y - other.y);
      if (distance < 130) {
        lifeCtx.globalAlpha = 1 - distance / 130;
        lifeCtx.strokeStyle = palette[index % palette.length];
        lifeCtx.lineWidth = 0.6;
        lifeCtx.beginPath();
        lifeCtx.moveTo(point.x, point.y);
        lifeCtx.lineTo(other.x, other.y);
        lifeCtx.stroke();
        lifeCtx.globalAlpha = 1;
      }
    });
  });

  requestAnimationFrame(animateLifeCanvas);
}

function setTool(tool) {
  qsa(".tool-card, .tab-btn").forEach((item) => {
    item.classList.toggle("active", item.dataset.tool === tool);
  });
  qsa(".tool-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tool);
  });
  qs("#laboratorio").scrollIntoView({ behavior: "smooth", block: "start" });
}

function randomHex(mode = "vibrant", index = 0, baseHue = Math.floor(Math.random() * 360)) {
  const modes = {
    vibrant: {
      hue: Math.floor(Math.random() * 360),
      saturation: 64 + Math.floor(Math.random() * 28),
      lightness: 42 + Math.floor(Math.random() * 22)
    },
    pastel: {
      hue: Math.floor(Math.random() * 360),
      saturation: 48 + Math.floor(Math.random() * 22),
      lightness: 72 + Math.floor(Math.random() * 12)
    },
    neon: {
      hue: Math.floor(Math.random() * 360),
      saturation: 88 + Math.floor(Math.random() * 12),
      lightness: 48 + Math.floor(Math.random() * 14)
    },
    earth: {
      hue: [24, 38, 74, 105, 138, 164, 18, 48][index % 8] + Math.floor(Math.random() * 14 - 7),
      saturation: 28 + Math.floor(Math.random() * 28),
      lightness: 28 + Math.floor(Math.random() * 32)
    },
    mono: {
      hue: baseHue,
      saturation: 42 + Math.floor(Math.random() * 18),
      lightness: 18 + index * 8
    },
    analogous: {
      hue: baseHue + (index - 3) * 18 + Math.floor(Math.random() * 8),
      saturation: 58 + Math.floor(Math.random() * 22),
      lightness: 38 + Math.floor(Math.random() * 28)
    }
  };

  const color = modes[mode] || modes.vibrant;
  return hslToHex(color.hue, color.saturation, color.lightness);
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)]
    .map((value) => Math.round(255 * value).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
    .padStart(6, "0")
    .replace(/^/, "#");
}

function renderPalette() {
  const grid = qs("#palette-grid");
  const card = qs("#card-palette");
  grid.innerHTML = "";
  card.innerHTML = "";

  palette.forEach((color) => {
    const button = document.createElement("button");
    button.className = "palette-color";
    button.type = "button";
    button.style.background = color;
    button.title = `Copiar ${color}`;
    button.innerHTML = `<span>${color}</span>`;
    button.addEventListener("click", () => copyColor(color));
    grid.appendChild(button);

    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.height = `${45 + Math.random() * 48}%`;
    swatch.style.background = color;
    card.appendChild(swatch);
  });
}

async function copyColor(color) {
  const feedback = qs("#copy-feedback");
  try {
    await navigator.clipboard.writeText(color);
    feedback.textContent = `${color} copiado`;
  } catch {
    feedback.textContent = `${color} selecionado`;
  }
}

async function copySnippet(targetId, button) {
  const code = document.getElementById(targetId);
  if (!code) return;

  try {
    await navigator.clipboard.writeText(code.textContent);
    button.textContent = "Copiado";
  } catch {
    button.textContent = "Selecionado";
  }

  setTimeout(() => {
    button.textContent = "Copiar";
  }, 1300);
}

function generatePalette() {
  const mode = qs("#palette-mode").value;
  const baseHue = Math.floor(Math.random() * 360);
  palette = Array.from({ length: 8 }, (_, index) => randomHex(mode, index, baseHue));
  qsa(".preset-btn").forEach((button) => button.classList.remove("active"));
  renderPalette();
}

function applyPalette() {
  document.documentElement.style.setProperty("--accent", palette[0]);
  document.documentElement.style.setProperty("--accent-blue", palette[1]);
  document.documentElement.style.setProperty("--accent-red", palette[2]);
  document.documentElement.style.setProperty("--accent-gold", palette[3]);
}

function usePresetPalette(presetName) {
  palette = [...presetPalettes[presetName]];
  qsa(".preset-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.preset === presetName);
  });
  renderPalette();
}

function updateClock() {
  const now = new Date();
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;
  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  ["card", "big"].forEach((prefix) => {
    const hour = qs(`#${prefix}-hour`);
    const minute = qs(`#${prefix}-minute`);
    const second = qs(`#${prefix}-second`);
    if (hour) hour.style.transform = `rotate(${hourDeg}deg)`;
    if (minute) minute.style.transform = `rotate(${minuteDeg}deg)`;
    if (second) second.style.transform = `rotate(${secondDeg}deg)`;
  });

  qs("#digital-time").textContent = now.toLocaleTimeString("pt-BR");
  qs("#digital-date").textContent = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

const calc = {
  display: "0",
  stored: null,
  operator: null,
  waiting: false
};

function updateCalcScreen() {
  qs("#calc-display").textContent = calc.display.replace(".", ",");
  qs("#calc-history").textContent = calc.operator && calc.stored !== null ? `${formatNumber(calc.stored)} ${operatorLabel(calc.operator)}` : "";
  qs("#calc-mini").textContent = calc.operator ? `${formatNumber(calc.stored)} ${operatorLabel(calc.operator)} ${calc.waiting ? "" : calc.display}` : calc.display.replace(".", ",");
}

function formatNumber(value) {
  return String(Number(value.toFixed(8))).replace(".", ",");
}

function operatorLabel(op) {
  return { "+": "+", "-": "−", "*": "×", "/": "÷" }[op] || op;
}

function inputNumber(value) {
  if (calc.waiting) {
    calc.display = value === "." ? "0." : value;
    calc.waiting = false;
  } else if (value === "." && calc.display.includes(".")) {
    return;
  } else {
    calc.display = calc.display === "0" && value !== "." ? value : calc.display + value;
  }
  updateCalcScreen();
}

function chooseOperator(operator) {
  const input = Number(calc.display);
  if (calc.operator && !calc.waiting) calculate();
  calc.stored = calc.stored === null ? input : calc.stored;
  calc.operator = operator;
  calc.waiting = true;
  updateCalcScreen();
}

function calculate() {
  if (!calc.operator || calc.stored === null) return;
  const current = Number(calc.display);
  const operations = {
    "+": calc.stored + current,
    "-": calc.stored - current,
    "*": calc.stored * current,
    "/": current === 0 ? NaN : calc.stored / current
  };
  const result = operations[calc.operator];
  calc.display = Number.isFinite(result) ? String(Number(result.toFixed(8))) : "Erro";
  calc.stored = null;
  calc.operator = null;
  calc.waiting = true;
  updateCalcScreen();
}

function handleCalcAction(action) {
  if (action === "clear") {
    calc.display = "0";
    calc.stored = null;
    calc.operator = null;
    calc.waiting = false;
  }
  if (action === "backspace") calc.display = calc.display.length > 1 ? calc.display.slice(0, -1) : "0";
  if (action === "percent") calc.display = String(Number(calc.display) / 100);
  if (action === "sign") calc.display = String(Number(calc.display) * -1);
  if (action === "equals") calculate();
  updateCalcScreen();
}

function setTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("light-theme", isLight);
  localStorage.setItem("creative-theme", theme);
  qs("#theme-state").textContent = isLight ? "Tema claro ativo" : "Tema escuro ativo";
  qs("#theme-toggle").setAttribute("aria-pressed", String(isLight));
  qs("#theme-mini").textContent = isLight ? "☀" : "◐";
}

function toggleTheme() {
  setTheme(document.body.classList.contains("light-theme") ? "dark" : "light");
}

function getTypewriterPhrases() {
  return qs("#typewriter-input").value
    .split(",")
    .map((phrase) => phrase.trim())
    .filter(Boolean);
}

function runTypewriter() {
  const phrases = getTypewriterPhrases();
  const output = qs("#typewriter-output");
  const mini = qs("#typewriter-mini");
  const speed = Number(qs("#typewriter-speed").value);

  if (!phrases.length) return;

  const phrase = phrases[typewriterPhrase % phrases.length];
  if (typewriterDeleting) {
    typewriterLetter -= 1;
  } else {
    typewriterLetter += 1;
  }

  const text = phrase.slice(0, typewriterLetter);
  output.textContent = text;
  mini.textContent = `${text}_`;

  if (!typewriterDeleting && typewriterLetter === phrase.length) {
    typewriterDeleting = true;
    typewriterTimer = setTimeout(runTypewriter, 1000);
    return;
  }

  if (typewriterDeleting && typewriterLetter === 0) {
    typewriterDeleting = false;
    typewriterPhrase += 1;
  }

  typewriterTimer = setTimeout(runTypewriter, typewriterDeleting ? speed / 2 : speed);
}

function restartTypewriter() {
  clearTimeout(typewriterTimer);
  typewriterPhrase = 0;
  typewriterLetter = 0;
  typewriterDeleting = false;
  runTypewriter();
}

function openLightbox(index) {
  currentImage = index;
  const modal = qs("#lightbox-modal");
  const item = gallery[currentImage];
  qs("#modal-art").style.background = item.bg;
  qs("#modal-caption").textContent = item.name;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeLightbox() {
  const modal = qs("#lightbox-modal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function moveLightbox(direction) {
  currentImage = (currentImage + direction + gallery.length) % gallery.length;
  openLightbox(currentImage);
}

function revealOnScroll() {
  const elements = qsa(".fade-up");
  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  elements.forEach((element) => observer.observe(element));
}

document.addEventListener("mousemove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

window.addEventListener("resize", resizeLifeCanvas);

qsa(".tool-card, .tab-btn").forEach((button) => {
  button.addEventListener("click", () => setTool(button.dataset.tool));
});

qsa('a[href="#guia"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    setTool("guide");
  });
});

qsa(".copy-snippet").forEach((button) => {
  button.addEventListener("click", () => copySnippet(button.dataset.copyTarget, button));
});

qs("#generate-palette").addEventListener("click", generatePalette);
qs("#apply-palette").addEventListener("click", applyPalette);
qs("#palette-mode").addEventListener("change", generatePalette);
qsa(".preset-btn").forEach((button) => {
  button.addEventListener("click", () => usePresetPalette(button.dataset.preset));
});
qs("#theme-toggle").addEventListener("click", toggleTheme);
qs("#theme-mini").addEventListener("click", toggleTheme);
qs("#restart-typewriter").addEventListener("click", restartTypewriter);
qs("#typewriter-input").addEventListener("input", restartTypewriter);
qs("#typewriter-speed").addEventListener("input", restartTypewriter);

qsa(".calc-keys button").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.num) inputNumber(button.dataset.num);
    if (button.dataset.op) chooseOperator(button.dataset.op);
    if (button.dataset.action) handleCalcAction(button.dataset.action);
  });
});

document.addEventListener("keydown", (event) => {
  const isTypingField = ["INPUT", "TEXTAREA"].includes(event.target.tagName);
  const lightboxOpen = qs("#lightbox-modal").classList.contains("open");

  if (isTypingField && event.key !== "Escape") return;
  if (lightboxOpen && !["Escape", "ArrowRight", "ArrowLeft"].includes(event.key)) return;

  if (/^[0-9.]$/.test(event.key)) inputNumber(event.key);
  if (event.key === ",") inputNumber(".");
  if (["+", "-", "*", "/"].includes(event.key)) chooseOperator(event.key);
  if (event.key === "Enter" || event.key === "=") calculate();
  if (event.key === "Backspace") handleCalcAction("backspace");
  if (event.key === "Escape") {
    handleCalcAction("clear");
    closeLightbox();
  }
  if (lightboxOpen && event.key === "ArrowRight") moveLightbox(1);
  if (lightboxOpen && event.key === "ArrowLeft") moveLightbox(-1);
});

qsa(".gallery-item").forEach((button) => {
  button.style.background = gallery[Number(button.dataset.index)].bg;
  button.addEventListener("click", () => openLightbox(Number(button.dataset.index)));
});

qs("#modal-close").addEventListener("click", closeLightbox);
qs("#modal-next").addEventListener("click", () => moveLightbox(1));
qs("#modal-prev").addEventListener("click", () => moveLightbox(-1));
qs("#lightbox-modal").addEventListener("click", (event) => {
  if (event.target.id === "lightbox-modal") closeLightbox();
});

resizeLifeCanvas();
renderPalette();
applyPalette();
updateClock();
updateCalcScreen();
setTheme(localStorage.getItem("creative-theme") || "dark");
restartTypewriter();
bindCursorHover();
animateCursor();
animateLifeCanvas();
revealOnScroll();

setInterval(updateClock, 1000);
