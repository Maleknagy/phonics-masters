import confetti from 'canvas-confetti';

const zIndex = 9999;

// --- INDIVIDUAL EFFECTS ---

const fireStars = () => {
  confetti({ 
    particleCount: 50, spread: 360, ticks: 50, gravity: 0, decay: 0.94, 
    startVelocity: 30, shapes: ['star'], colors: ['FFE400', 'FFBD00', 'E89400'], zIndex 
  });
};

const fireBalloons = () => {
  const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];
  confetti({
    particleCount: 40, angle: 90, spread: 80, origin: { y: 1.2 }, 
    colors: colors, gravity: -0.1, scalar: 3, shapes: ['circle'], zIndex
  });
};

const fireStreamers = () => {
  confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, zIndex });
  confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, zIndex });
};

const fireFireworks = () => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];

  (function frame() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return;
    confetti({ 
        particleCount: 1, startVelocity: 0, ticks: 100, 
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: [colors[Math.floor(Math.random() * colors.length)]],
        shapes: ['circle'], gravity: 0.5, scalar: 2, zIndex
    });
    requestAnimationFrame(frame);
  }());
};

const fireSnow = () => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  (function frame() {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return;
    confetti({
      particleCount: 1, startVelocity: 0, ticks: 200,
      origin: { x: Math.random(), y: -0.2 },
      gravity: 0.3, colors: ['#ffffff'], shapes: ['circle'], scalar: 0.7, zIndex
    });
    requestAnimationFrame(frame);
  }());
};

const fireSchoolEmoji = () => {
  const scalar = 2.5;
  const shapes = [
    confetti.shapeFromText({ text: '📚', scalar }),
    confetti.shapeFromText({ text: '✏️', scalar }),
    confetti.shapeFromText({ text: '🍎', scalar }),
    confetti.shapeFromText({ text: '💡', scalar })
  ];
  confetti({ shapes, particleCount: 20, scalar, zIndex, origin: { y: 0.7 } });
};

const fireSpaceEmoji = () => {
    const scalar = 2.5;
    const shapes = [
      confetti.shapeFromText({ text: '🚀', scalar }),
      confetti.shapeFromText({ text: '👽', scalar }),
      confetti.shapeFromText({ text: '🪐', scalar }),
      confetti.shapeFromText({ text: '✨', scalar })
    ];
    confetti({ shapes, particleCount: 20, scalar, zIndex, origin: { y: 0.7 } });
};

// --- THE MEMORY SYSTEM ---

let lastEffects = [];
const allEffects = [fireStars, fireBalloons, fireStreamers, fireFireworks, fireSnow, fireSchoolEmoji, fireSpaceEmoji];

export const fireRandomCelebration = () => {
  // Filter out the last 3 effects played so they don't repeat too soon
  const available = allEffects.filter(effect => !lastEffects.includes(effect.name));
  
  // Pick a random one from the available list
  const selected = available[Math.floor(Math.random() * available.length)];
  
  // Play it
  selected();

  // Update memory: Keep track of the last 3 effects played
  lastEffects.push(selected.name);
  if (lastEffects.length > 3) {
    lastEffects.shift(); // Remove the oldest one
  }
};