// ========================================
// KANDINSKY COLOR THEORY EXPLORER
// Interactive drag-and-drop learning component
// ========================================

(function initColorTheoryExplorer() {
  const colorGame = document.querySelector('.color-game');
  
  if (!colorGame) {
    return;
  }

  // Correct color-form associations (Kandinsky's theory)
  const correctAssociations = {
    'red': 'square',
    'blue': 'circle',
    'yellow': 'triangle'
  };

  // Track placed colors
  const placedColors = {
    'square': null,
    'circle': null,
    'triangle': null
  };

  // Get elements
  const colorSwatches = document.querySelectorAll('.color-swatch');
  const shapeTargets = document.querySelectorAll('.shape-target');
  const feedbackMessage = document.querySelector('.feedback-message');
  const resetButton = document.querySelector('.reset-button');

  // Drag state
  let draggedElement = null;
  let draggedColor = null;

  // ========================================
  // INITIALIZE DRAG AND DROP
  // ========================================

  colorSwatches.forEach(swatch => {
    // Mouse events
    swatch.addEventListener('dragstart', handleDragStart);
    swatch.addEventListener('dragend', handleDragEnd);
    
    // Touch events
    swatch.addEventListener('touchstart', handleTouchStart, { passive: false });
    swatch.addEventListener('touchmove', handleTouchMove, { passive: false });
    swatch.addEventListener('touchend', handleTouchEnd);

    // Keyboard accessibility
    swatch.setAttribute('tabindex', '0');
    swatch.setAttribute('role', 'button');
    swatch.setAttribute('aria-grabbed', 'false');
    
    swatch.addEventListener('keydown', handleKeyboardDrag);
  });

  shapeTargets.forEach(target => {
    // Drag events
    target.addEventListener('dragover', handleDragOver);
    target.addEventListener('drop', handleDrop);
    target.addEventListener('dragleave', handleDragLeave);
    
    // Make focusable for keyboard users
    target.setAttribute('tabindex', '-1');
  });

  if (resetButton) {
    resetButton.addEventListener('click', resetGame);
  }

  // ========================================
  // DRAG HANDLERS (Mouse)
  // ========================================

  function handleDragStart(e) {
    draggedElement = e.target;
    draggedColor = e.target.dataset.color;
    
    e.target.classList.add('dragging');
    e.target.setAttribute('aria-grabbed', 'true');
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
  }

  function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    e.target.setAttribute('aria-grabbed', 'false');
    
    // Remove all drag-over states
    shapeTargets.forEach(target => {
      target.classList.remove('drag-over');
    });
  }

  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    
    e.dataTransfer.dropEffect = 'move';
    e.target.closest('.shape-target')?.classList.add('drag-over');
    
    return false;
  }

  function handleDragLeave(e) {
    e.target.closest('.shape-target')?.classList.remove('drag-over');
  }

  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    
    e.preventDefault();
    
    const target = e.target.closest('.shape-target');
    if (!target) return;
    
    target.classList.remove('drag-over');
    
    const shape = target.dataset.shape;
    placeColor(shape, draggedColor, draggedElement);
    
    return false;
  }

  // ========================================
  // TOUCH HANDLERS (Mobile)
  // ========================================

  let touchStartX, touchStartY;
  let clonedElement = null;

  function handleTouchStart(e) {
    e.preventDefault();
    
    draggedElement = e.target.closest('.color-swatch');
    draggedColor = draggedElement.dataset.color;
    
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    // Create visual feedback
    draggedElement.classList.add('dragging');
    
    // Create clone for visual feedback
    clonedElement = draggedElement.cloneNode(true);
    clonedElement.style.position = 'fixed';
    clonedElement.style.pointerEvents = 'none';
    clonedElement.style.zIndex = '1000';
    clonedElement.style.opacity = '0.8';
    clonedElement.style.width = draggedElement.offsetWidth + 'px';
    clonedElement.style.height = draggedElement.offsetHeight + 'px';
    document.body.appendChild(clonedElement);
    
    updateClonePosition(touch.clientX, touch.clientY);
  }

  function handleTouchMove(e) {
    if (!draggedElement) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    updateClonePosition(touch.clientX, touch.clientY);
    
    // Check if over a target
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const target = element?.closest('.shape-target');
    
    // Remove previous highlights
    shapeTargets.forEach(t => t.classList.remove('drag-over'));
    
    // Highlight current target
    if (target) {
      target.classList.add('drag-over');
    }
  }

  function handleTouchEnd(e) {
    if (!draggedElement) return;
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const target = element?.closest('.shape-target');
    
    if (target) {
      const shape = target.dataset.shape;
      placeColor(shape, draggedColor, draggedElement);
    }
    
    // Cleanup
    draggedElement.classList.remove('dragging');
    if (clonedElement && clonedElement.parentNode) {
      clonedElement.parentNode.removeChild(clonedElement);
    }
    clonedElement = null;
    draggedElement = null;
    draggedColor = null;
    
    shapeTargets.forEach(t => t.classList.remove('drag-over'));
  }

  function updateClonePosition(x, y) {
    if (clonedElement) {
      clonedElement.style.left = (x - clonedElement.offsetWidth / 2) + 'px';
      clonedElement.style.top = (y - clonedElement.offsetHeight / 2) + 'px';
    }
  }

  // ========================================
  // KEYBOARD HANDLERS (Accessibility)
  // ========================================

  let selectedSwatch = null;
  let selectedTargetIndex = 0;

  function handleKeyboardDrag(e) {
    const swatch = e.target;
    const color = swatch.dataset.color;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      
      // Select/deselect swatch
      if (selectedSwatch === swatch) {
        selectedSwatch.classList.remove('selected');
        selectedSwatch.setAttribute('aria-grabbed', 'false');
        selectedSwatch = null;
      } else {
        // Deselect previous
        if (selectedSwatch) {
          selectedSwatch.classList.remove('selected');
          selectedSwatch.setAttribute('aria-grabbed', 'false');
        }
        
        // Select new
        selectedSwatch = swatch;
        selectedSwatch.classList.add('selected');
        selectedSwatch.setAttribute('aria-grabbed', 'true');
        selectedTargetIndex = 0;
        
        // Focus first target
        shapeTargets[0].focus();
        
        announceToScreenReader(`Selected ${color} color. Use arrow keys to navigate shapes, Enter to place.`);
      }
    }
  }

  // Allow arrow key navigation between targets
  shapeTargets.forEach((target, index) => {
    target.addEventListener('keydown', (e) => {
      if (!selectedSwatch) return;
      
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const shape = target.dataset.shape;
        const color = selectedSwatch.dataset.color;
        placeColor(shape, color, selectedSwatch);
        
        selectedSwatch.classList.remove('selected');
        selectedSwatch.setAttribute('aria-grabbed', 'false');
        selectedSwatch.focus();
        selectedSwatch = null;
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        selectedTargetIndex = (index + 1) % shapeTargets.length;
        shapeTargets[selectedTargetIndex].focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        selectedTargetIndex = (index - 1 + shapeTargets.length) % shapeTargets.length;
        shapeTargets[selectedTargetIndex].focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        selectedSwatch.classList.remove('selected');
        selectedSwatch.setAttribute('aria-grabbed', 'false');
        selectedSwatch.focus();
        selectedSwatch = null;
      }
    });
  });

  // ========================================
  // GAME LOGIC
  // ========================================

  function placeColor(shape, color, swatchElement) {
    const target = document.querySelector(`[data-shape="${shape}"]`);
    if (!target) return;
    
    // Remove any previous placement in this shape
    const previousColor = placedColors[shape];
    if (previousColor) {
      // Re-enable the previous swatch
      const previousSwatch = document.querySelector(`[data-color="${previousColor}"]`);
      if (previousSwatch) {
        previousSwatch.style.opacity = '1';
        previousSwatch.setAttribute('draggable', 'true');
        previousSwatch.style.cursor = 'grab';
        previousSwatch.classList.remove('placed');
      }
    }
    
    // Remove this color from any other shape it might be in
    Object.keys(placedColors).forEach(s => {
      if (placedColors[s] === color && s !== shape) {
        placedColors[s] = null;
        const otherTarget = document.querySelector(`[data-shape="${s}"]`);
        if (otherTarget) {
          otherTarget.classList.remove('correct', 'incorrect', 'filled');
          const colorBadge = otherTarget.querySelector('.color-badge');
          if (colorBadge) colorBadge.remove();
        }
      }
    });
    
    // Store new placement
    placedColors[shape] = color;
    
    // Clear previous states
    target.classList.remove('incorrect', 'correct');
    
    // Remove old badge if exists
    const oldBadge = target.querySelector('.color-badge');
    if (oldBadge) oldBadge.remove();
    
    // Create color badge indicator
    const badge = document.createElement('div');
    badge.className = `color-badge color-badge--${color}`;
    badge.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: ${getComputedStyle(swatchElement).backgroundColor};
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 2;
      transition: all 0.3s var(--transition-bauhaus);
      pointer-events: none;
    `;
    target.appendChild(badge);
    target.classList.add('filled');
    
    // Mark swatch as placed
    swatchElement.classList.add('placed');
    swatchElement.style.opacity = '0.5';
    swatchElement.style.cursor = 'grab'; // Keep draggable for repositioning
    
    // Check if correct
    const isCorrect = correctAssociations[color] === shape;
    
    if (isCorrect) {
      target.classList.add('correct');
      badge.style.borderColor = 'var(--color-success, #10b981)';
      badge.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(0,0,0,0.15)';
      announceToScreenReader(`Correct! ${color} matches ${shape}.`);
    } else {
      target.classList.add('incorrect');
      badge.style.borderColor = 'var(--color-primary, #dc2626)';
      badge.style.boxShadow = '0 0 0 4px rgba(220, 38, 38, 0.2), 0 4px 12px rgba(0,0,0,0.15)';
      // Shake animation
      badge.style.animation = 'shake 0.5s';
      announceToScreenReader(`Not quite. ${color} doesn't match ${shape}. Try dragging it to a different shape.`);
    }
    
    // Check if game complete
    setTimeout(checkCompletion, 300);
  }

  function checkCompletion() {
    const allPlaced = Object.values(placedColors).every(color => color !== null);
    const allCorrect = Object.entries(placedColors).every(
      ([shape, color]) => correctAssociations[color] === shape
    );
    
    if (allCorrect) {
      showFeedback('success', '🎉 Perfect! You\'ve mastered Kandinsky\'s color-form theory!');
    } else if (allPlaced) {
      showFeedback('incomplete', 'Not quite right. Try rearranging the colors.');
    }
  }

  function showFeedback(type, message) {
    if (!feedbackMessage) return;
    
    feedbackMessage.textContent = message;
    feedbackMessage.className = 'feedback-message show ' + type;
    
    announceToScreenReader(message);
  }

  function resetGame() {
    // Clear placements
    Object.keys(placedColors).forEach(key => {
      placedColors[key] = null;
    });
    
    // Reset visuals
    shapeTargets.forEach(target => {
      target.classList.remove('correct', 'incorrect', 'drag-over', 'filled');
      target.style.backgroundColor = '';
      // Remove color badges
      const badge = target.querySelector('.color-badge');
      if (badge) badge.remove();
    });
    
    colorSwatches.forEach(swatch => {
      swatch.style.opacity = '1';
      swatch.setAttribute('draggable', 'true');
      swatch.style.cursor = 'grab';
      swatch.classList.remove('selected', 'dragging', 'placed');
      swatch.setAttribute('aria-grabbed', 'false');
    });
    
    // Hide feedback
    if (feedbackMessage) {
      feedbackMessage.classList.remove('show');
      feedbackMessage.className = 'feedback-message';
    }
    
    selectedSwatch = null;
    announceToScreenReader('Game reset. Try again!');
  }

  // ========================================
  // ACCESSIBILITY HELPERS
  // ========================================

  function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.classList.add('sr-only');
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Add sr-only class if not exists
  if (!document.querySelector('style[data-sr-only]')) {
    const style = document.createElement('style');
    style.setAttribute('data-sr-only', 'true');
    style.textContent = `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
      .color-swatch.selected {
        outline: 3px solid var(--color-primary);
        outline-offset: 4px;
      }
    `;
    document.head.appendChild(style);
  }

})();

console.log('%c🎨 Color Theory Explorer Loaded', 'font-size: 12px; color: #ffd100;');
