const scriptInput = document.getElementById('scriptInput');
const teleprompter = document.getElementById('teleprompter');
const loadBtn = document.getElementById('loadBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const sizeSlider = document.getElementById('sizeSlider');
const sizeValue = document.getElementById('sizeValue');
const alignmentSelect = document.getElementById('alignmentSelect');
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
  const text = scriptInput.value;
  teleprompter.innerHTML = '';

  if (!text.trim()) {
    alert('Please enter some text for the teleprompter.');
    return;
  }

  // Split text into tokens, preserving spaces and newlines
  // We'll split by spaces but keep track of multiple spaces and newlines
  const lines = text.split(/\n/);
  wordSpans = [];
  let globalIndex = 0;

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) {
      // Add a newline span before each line except the first
      const newlineSpan = document.createElement('span');
      newlineSpan.textContent = '\n';
      newlineSpan.className = 'word newline';
      newlineSpan.dataset.index = globalIndex;
      teleprompter.appendChild(newlineSpan);
      wordSpans.push(newlineSpan);
      globalIndex++;
    }

    // Handle empty lines - if line is empty, add an empty span to preserve the line
    if (line.trim().length === 0 && line.length > 0) {
      // Line has only whitespace - preserve it
      const whitespaceSpan = document.createElement('span');
      whitespaceSpan.textContent = line;
      whitespaceSpan.className = 'word whitespace';
      whitespaceSpan.dataset.index = globalIndex;
      teleprompter.appendChild(whitespaceSpan);
      wordSpans.push(whitespaceSpan);
      globalIndex++;
    } else if (line.length === 0) {
      // Completely empty line - add a zero-width space to preserve it
      const emptySpan = document.createElement('span');
      emptySpan.textContent = ' ';
      emptySpan.className = 'word whitespace';
      emptySpan.dataset.index = globalIndex;
      teleprompter.appendChild(emptySpan);
      wordSpans.push(emptySpan);
      globalIndex++;
    } else {
      // Split line by spaces, but preserve multiple spaces
      const words = line.split(/(\s+)/);
      
      words.forEach((word) => {
        if (word.length === 0) return;
        
        const span = document.createElement('span');
        // If it's whitespace-only, preserve it as-is
        if (/^\s+$/.test(word)) {
          span.textContent = word;
          span.className = 'word whitespace';
        } else {
          // Regular word - add a space after it
          span.textContent = word + ' ';
          span.className = 'word';
        }
        span.dataset.index = globalIndex;
        teleprompter.appendChild(span);
        wordSpans.push(span);
        globalIndex++;
      });
    }
  });

  // Find the first non-whitespace/non-newline span to start at
  currentIndex = 0;
  while (currentIndex < wordSpans.length) {
    const span = wordSpans[currentIndex];
    if (span && !span.classList.contains('whitespace') && !span.classList.contains('newline')) {
      break;
    }
    currentIndex++;
  }
  // If all spans are whitespace/newline, just start at 0
  if (currentIndex >= wordSpans.length) {
    currentIndex = 0;
  }
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
    // Only highlight if it's not a whitespace-only or newline span
    if (!currentSpan.classList.contains('whitespace') && !currentSpan.classList.contains('newline')) {
      currentSpan.classList.add('current');
    }
    
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

function updateTextAlignment() {
  const alignment = alignmentSelect.value || 'left';
  teleprompter.style.textAlign = alignment;
}

function stepForward() {
  if (currentIndex < wordSpans.length - 1) {
    currentIndex++;
    // Skip whitespace-only and newline spans when advancing
    while (currentIndex < wordSpans.length - 1) {
      const span = wordSpans[currentIndex];
      if (span && (span.classList.contains('whitespace') || span.classList.contains('newline'))) {
        currentIndex++;
      } else {
        break;
      }
    }
    highlightCurrentWord();
  } else {
    stopPlayback();
  }
}

function stepBackward() {
  if (currentIndex > 0) {
    currentIndex--;
    // Skip whitespace-only and newline spans when going backward
    while (currentIndex > 0) {
      const span = wordSpans[currentIndex];
      if (span && (span.classList.contains('whitespace') || span.classList.contains('newline'))) {
        currentIndex--;
      } else {
        break;
      }
    }
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
  
  // Move button to body when sidebar is hidden to ensure it's clickable
  if (isHidden) {
    document.body.classList.add('sidebar-hidden');
    // Move button to body to ensure it's clickable
    document.body.appendChild(toggleSidebarBtn);
    toggleSidebarBtn.classList.add('floating-toggle');
  } else {
    document.body.classList.remove('sidebar-hidden');
    // Move button back to sidebar header
    const sidebarHeader = document.querySelector('.sidebar-header');
    if (sidebarHeader && !sidebarHeader.contains(toggleSidebarBtn)) {
      sidebarHeader.appendChild(toggleSidebarBtn);
    }
    toggleSidebarBtn.classList.remove('floating-toggle');
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

alignmentSelect.addEventListener('change', () => {
  updateTextAlignment();
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

// Initialize text size and alignment
updateTextSize();
updateTextAlignment();

// Initialize floating button state
floatingPlayPauseBtn.textContent = 'Play';
floatingResetBtn.textContent = 'Reset';

// Auto-load the default sample text
loadScript();

