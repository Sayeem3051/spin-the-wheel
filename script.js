// Data structure
const topics = [
  { name: 'AI', removed: false },
  { name: 'Cybersecurity', removed: false },
  { name: 'C programming', removed: false },
  { name: 'Cloud computing', removed: false },
  { name: 'Browsers', removed: false }
];

// Elements
const wheelEl = document.getElementById('wheel');
const labelsEl = document.getElementById('labels');
const spinButton = document.getElementById('spinButton');
const statusEl = document.getElementById('status');
const legendList = document.getElementById('legendList');
const selectedHistoryEl = document.getElementById('selectedHistory');

// State
let currentRotation = 0; // degrees
let spinning = false;
let selectedTopics = [];

// Utils
const clamp = (min, val, max) => Math.max(min, Math.min(val, max));
const modulo = (n, m) => ((n % m) + m) % m;

function getActiveTopics() {
  return topics.filter(t => !t.removed);
}

function buildGradient(colors) {
  // Evenly split remaining topics
  const n = colors.length;
  if (n === 0) return 'conic-gradient(from -90deg, #ddd 0 360deg)';
  const slice = 360 / n;
  const stops = colors.map((color, i) => {
    const start = (slice * i).toFixed(4);
    const end = (slice * (i + 1)).toFixed(4);
    return `${color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(from -90deg, ${stops.join(', ')})`;
}

function generateColors(n) {
  // Professional blue theme with variations
  const colors = [];
  for (let i = 0; i < n; i++) {
    const hue = 220; // Blue base
    const saturation = 75 + (i * 5); // Vary saturation
    const lightness = 45 + (i * 8); // Vary lightness
    colors.push(`hsl(${hue} ${saturation}% ${lightness}%)`);
  }
  return colors;
}

function setWheelSizeVar() {
  // Use the rendered width to drive precise label placement
  const size = wheelEl.offsetWidth;
  wheelEl.style.setProperty('--wheel-size', `${size}px`);
}

function renderLabels(active) {
  labelsEl.innerHTML = '';
  const n = active.length;
  if (n === 0) return;
  const slice = 360 / n;
  for (let i = 0; i < n; i++) {
    const centerAngle = i * slice + slice / 2; // relative to -90deg start
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = active[i].name;
    // Place toward rim, keep text upright
    label.style.transform = `rotate(${centerAngle}deg) translateY(calc(-1 * (var(--wheel-size) / 2 - 88px))) rotate(${-centerAngle}deg)`;
    labelsEl.appendChild(label);
  }
}

function renderLegend(active, colors) {
  legendList.innerHTML = '';
  const colorMapByName = new Map();
  active.forEach((t, i) => colorMapByName.set(t.name, colors[i]));
  topics.forEach(t => {
    const li = document.createElement('li');
    li.className = 'legend-item' + (t.removed ? ' removed' : '');
    const swatch = document.createElement('span');
    swatch.className = 'legend-swatch';
    swatch.style.background = t.removed ? 'repeating-linear-gradient(45deg, #666 0 6px, #888 6px 12px)' : (colorMapByName.get(t.name) || '#ddd');
    const label = document.createElement('span');
    label.textContent = t.name + (t.removed ? ' (removed)' : '');
    li.appendChild(swatch);
    li.appendChild(label);
    legendList.appendChild(li);
  });
}

function renderSelectedHistory() {
  console.log('Rendering selected history:', selectedTopics); // Debug log
  
  if (selectedTopics.length === 0) {
    selectedHistoryEl.innerHTML = '<h3>📋 No topics selected yet</h3>';
    return;
  }
  
  selectedHistoryEl.innerHTML = `
    <h3>📋 Selected Topics (${selectedTopics.length})</h3>
    <ul class="selected-topics">
      ${selectedTopics.map((topic, index) => `<li class="selected-topic">${index + 1}. ${topic}</li>`).join('')}
    </ul>
  `;
}

function renderWheel() {
  setWheelSizeVar();
  const active = getActiveTopics();
  const n = active.length;
  const colors = generateColors(n);
  wheelEl.style.background = buildGradient(colors);
  renderLabels(active);
  renderLegend(active, colors);
  renderSelectedHistory();

  // Button state
  const noneLeft = n === 0;
  spinButton.disabled = noneLeft;
  spinButton.setAttribute('aria-disabled', String(noneLeft));
  
  // Set initial status
  if (noneLeft) {
    statusEl.textContent = '🎉 All topics have been selected!';
  } else if (selectedTopics.length === 0) {
    statusEl.textContent = 'Click Spin to select a topic!';
  }
}

function chooseRandomIndex(n) {
  return Math.floor(Math.random() * n);
}

function onSpin() {
  const active = getActiveTopics();
  if (spinning) {
    statusEl.textContent = 'Please wait for the current spin to finish.';
    return;
  }
  if (active.length === 0) {
    statusEl.textContent = 'All topics have been selected!';
    spinButton.disabled = true;
    spinButton.setAttribute('aria-disabled', 'true');
    return;
  }

  spinning = true;
  spinButton.disabled = true;
  spinButton.setAttribute('aria-disabled', 'true');

  const n = active.length;
  const slice = 360 / n;
  const selectedIdx = chooseRandomIndex(n);
  const selectedTopic = active[selectedIdx];
  const centerAngle = selectedIdx * slice + slice / 2; // relative to -90deg start

  // Compute final rotation: ensure at least 2 full turns, land with selected center at pointer top
  const currentNorm = modulo(currentRotation, 360);
  const extraSpins = 2 + Math.floor(Math.random() * 3); // 2..4
  const durationSec = clamp(2, 1.6 + extraSpins * 0.6, 4); // map spins to 2..4s
  const delta = (extraSpins * 360) + (90 - centerAngle) - currentNorm;
  const finalRotation = currentRotation + delta;

  // Apply animation
  wheelEl.style.transition = `transform ${durationSec}s cubic-bezier(.17,.67,.31,1)`;
  requestAnimationFrame(() => {
    wheelEl.style.transform = `rotate(${finalRotation}deg)`;
  });

  const handleEnd = () => {
    wheelEl.removeEventListener('transitionend', handleEnd);
    // Normalize rotation to keep values small
    currentRotation = modulo(finalRotation, 360);
    wheelEl.style.transition = 'none';
    wheelEl.style.transform = `rotate(${currentRotation}deg)`;
    // allow styles to flush, then restore transition for next spins
    requestAnimationFrame(() => {
      wheelEl.style.transition = 'transform 3s cubic-bezier(.17,.67,.31,1)';
    });

    // Mark topic as removed
    const topic = topics.find(t => t.name === selectedTopic.name);
    if (topic) topic.removed = true;

    // Add to selected topics history
    selectedTopics.push(selectedTopic.name);
    console.log('Added topic to history:', selectedTopic.name); // Debug log
    console.log('Current selected topics:', selectedTopics); // Debug log
    
    statusEl.textContent = `🎯 Selected: ${selectedTopic.name}`;

    // Re-render with topic removed
    renderWheel();

    spinning = false;
    const anyLeft = getActiveTopics().length > 0;
    spinButton.disabled = !anyLeft;
    spinButton.setAttribute('aria-disabled', String(!anyLeft));
    if (!anyLeft) {
      statusEl.textContent = '🎉 All topics have been selected!';
    }
  };

  wheelEl.addEventListener('transitionend', handleEnd, { once: true });
}

// Initialize
function init() {
  renderWheel();
  window.addEventListener('resize', () => {
    // keep labels positioned correctly on resize
    renderWheel();
  });
  spinButton.addEventListener('click', onSpin);
}

document.addEventListener('DOMContentLoaded', init);


