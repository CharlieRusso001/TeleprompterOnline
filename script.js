const scriptInput = document.getElementById('scriptInput');
const teleprompter = document.getElementById('teleprompter');
const loadBtn = document.getElementById('loadBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const sizeSlider = document.getElementById('sizeSlider');
const sizeValue = document.getElementById('sizeValue');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const floatingPlayPauseBtn = document.getElementById('floatingPlayPauseBtn');
const floatingResetBtn = document.getElementById('floatingResetBtn');

let wordSpans = [];
let currentIndex = 0;
let timerId = null;
let isPlaying = false;
const baseWordDelay = 350; // ms per word at speed 1.0

function loadScript() {
  const text = scriptInput.value.trim();
  teleprompter.innerHTML = '';

  if (!text) {
    alert('Please enter some text for the teleprompter.');
    return;
  }

  const words = text.split(/\s+/);
  wordSpans = words.map((word, idx) => {
    const span = document.createElement('span');
    span.textContent = word + ' ';
    span.className = 'word';
    span.dataset.index = idx;
    teleprompter.appendChild(span);
    return span;
  });

  currentIndex = 0;
  highlightCurrentWord();
  playPauseBtn.disabled = false;
  floatingPlayPauseBtn.disabled = false;
  resetBtn.disabled = false;
  floatingResetBtn.disabled = false;
}

function highlightCurrentWord() {
  wordSpans.forEach(span => span.classList.remove('current'));

  const currentSpan = wordSpans[currentIndex];
  if (currentSpan) {
    currentSpan.classList.add('current');
    
    // Get the bounding rect of the current word relative to the teleprompter
    const teleprompterRect = teleprompter.getBoundingClientRect();
    const spanRect = currentSpan.getBoundingClientRect();
    
    // Calculate the vertical center of the word's line
    // The word's top position relative to the teleprompter's content
    const spanTopRelative = currentSpan.offsetTop;
    
    // Get the line height to center the line properly
    const lineHeight = parseFloat(getComputedStyle(teleprompter).lineHeight);
    
    // Calculate where the center of the line containing this word is
    // We want to center the line, so we use the line's midpoint
    const lineCenter = spanTopRelative + (lineHeight / 2);
    
    // Calculate target scroll to center this line in the viewport
    const teleprompterCenter = teleprompter.clientHeight / 2;
    const targetScroll = lineCenter - teleprompterCenter;
    
    teleprompter.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: 'smooth'
    });
  }
}

function getDelay() {
  const speed = parseFloat(speedSlider.value) || 1;
  return baseWordDelay / speed;
}

function updateTextSize() {
  const size = parseFloat(sizeSlider.value) || 1;
  teleprompter.style.fontSize = `${size}rem`;
  sizeValue.textContent = size.toFixed(1) + 'rem';
}

function stepForward() {
  if (currentIndex < wordSpans.length - 1) {
    currentIndex++;
    highlightCurrentWord();
  } else {
    stopPlayback();
  }
}

function stepBackward() {
  if (currentIndex > 0) {
    currentIndex--;
    highlightCurrentWord();
  }
}

function scheduleNextWord() {
  clearTimeout(timerId);
  if (!isPlaying) return;

  timerId = setTimeout(() => {
    stepForward();
    if (isPlaying && currentIndex < wordSpans.length - 1) {
      scheduleNextWord();
    } else {
      stopPlayback();
    }
  }, getDelay());
}

function startPlayback() {
  if (!wordSpans.length) return;
  if (isPlaying) return;

  isPlaying = true;
  playPauseBtn.textContent = 'Pause';
  floatingPlayPauseBtn.textContent = 'Pause';
  scheduleNextWord();
}

function stopPlayback() {
  isPlaying = false;
  playPauseBtn.textContent = 'Play';
  floatingPlayPauseBtn.textContent = 'Play';
  clearTimeout(timerId);
}

function togglePlayback() {
  if (!wordSpans.length) return;
  if (isPlaying) {
    stopPlayback();
  } else {
    startPlayback();
  }
}

function resetTeleprompter() {
  stopPlayback();
  currentIndex = 0;
  highlightCurrentWord();
}

// Toggle sidebar visibility
function toggleSidebar() {
  sidebar.classList.toggle('hidden');
  const isHidden = sidebar.classList.contains('hidden');
  toggleSidebarBtn.textContent = isHidden ? '+' : '−';
  floatingPlayPauseBtn.style.display = isHidden ? 'block' : 'none';
  floatingResetBtn.style.display = isHidden ? 'block' : 'none';
  
  // Add/remove class to body for CSS styling
  if (isHidden) {
    document.body.classList.add('sidebar-hidden');
  } else {
    document.body.classList.remove('sidebar-hidden');
  }
}

// Event Listeners
loadBtn.addEventListener('click', loadScript);
playPauseBtn.addEventListener('click', togglePlayback);
floatingPlayPauseBtn.addEventListener('click', togglePlayback);
resetBtn.addEventListener('click', resetTeleprompter);
floatingResetBtn.addEventListener('click', resetTeleprompter);
toggleSidebarBtn.addEventListener('click', toggleSidebar);

speedSlider.addEventListener('input', () => {
  speedValue.textContent = speedSlider.value + '×';
  // Reschedule timer if it's playing, so the new speed applies immediately
  if (isPlaying) {
    scheduleNextWord();
  }
});

sizeSlider.addEventListener('input', () => {
  updateTextSize();
});

// Keyboard shortcuts: Space = play/pause, Arrows = step
document.addEventListener('keydown', (e) => {
  const activeTag = document.activeElement.tagName.toLowerCase();
  const typingInInput = activeTag === 'textarea' || activeTag === 'input';

  if (typingInInput) return;

  if (e.code === 'Space') {
    e.preventDefault();
    togglePlayback();
  } else if (e.code === 'ArrowRight') {
    e.preventDefault();
    stopPlayback();
    stepForward();
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault();
    stopPlayback();
    stepBackward();
  }
});

// Initialize text size
updateTextSize();

// Initialize floating button state
floatingPlayPauseBtn.textContent = 'Play';
floatingResetBtn.textContent = 'Reset';

// Auto-load the default sample text
loadScript();

