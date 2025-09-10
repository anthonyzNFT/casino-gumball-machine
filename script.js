// script.js
// Expert-level code with extensive comments for user customization

// Global Variables
let coins = parseInt(localStorage.getItem('coins')) || 10; // Start with 10 coins
let points = parseInt(localStorage.getItem('points')) || 0;
let gumballsCollected = 0;
let inventory = 50; // Initial gumballs in machine
let isMuted = false;
let isDarkMode = false;
let coinInserted = false;
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

// Audio Elements
const coinClink = document.getElementById('coin-clink');
const crankSound = document.getElementById('crank-sound');
const gumballBounce = document.getElementById('gumball-bounce');
const jackpotFanfare = document.getElementById('jackpot-fanfare');
const bgMusic = document.getElementById('background-music');

// Elements
const coinCountEl = document.getElementById('coin-count');
const pointCountEl = document.getElementById('point-count');
const gumballCountEl = document.getElementById('gumball-count');
const insertBtn = document.getElementById('insert-coin-btn');
const turnBtn = document.getElementById('turn-handle-btn');
const refillBtn = document.getElementById('refill-btn');
const muteBtn = document.getElementById('mute-btn');
const darkModeBtn = document.getElementById('dark-mode-toggle');
const trayEl = document.getElementById('tray');
const virtualCoin = document.getElementById('virtual-coin');
const handleEl = document.getElementById('handle');
const leaderboardList = document.getElementById('leaderboard-list');

// Matter.js Physics Setup for Gumball Fall
let engine, render, runner, world;
function initPhysics() {
    engine = Matter.Engine.create();
    world = engine.world;
    render = Matter.Render.create({
        canvas: document.getElementById('gumball-canvas'),
        engine: engine,
        options: {
            width: 300,
            height: 300,
            background: 'transparent',
            wireframes: false
        }
    });
    runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // Add static walls for dome (simplified)
    Matter.World.add(world, [
        Matter.Bodies.rectangle(150, 290, 300, 20, { isStatic: true }), // Bottom
        Matter.Bodies.rectangle(10, 150, 20, 300, { isStatic: true }), // Left
        Matter.Bodies.rectangle(290, 150, 20, 300, { isStatic: true }) // Right
    ]);

    // Initial Gumballs (pile up)
    for (let i = 0; i < inventory; i++) {
        addGumball(Math.random() * 250 + 25, Math.random() * -100 - 50); // Drop from top
    }
}

// Add a gumball body
function addGumball(x, y, color = getRandomColor()) {
    const gumball = Matter.Bodies.circle(x, y, 10, {
        restitution: 0.5, // Bouncy
        render: { fillStyle: color }
    });
    Matter.World.add(world, gumball);
    return gumball;
}

// Random Color with Rarity
function getRandomColor() {
    const rand = Math.random();
    if (rand < 0.05) return '#FFD700'; // Golden rare
    if (rand < 0.3) return '#800080'; // Purple uncommon
    const commons = ['#FF0000', '#0000FF', '#008000', '#FFFF00']; // Red, Blue, Green, Yellow
    return commons[Math.floor(Math.random() * commons.length)];
}

// Get Points from Color
function getPointsFromColor(color) {
    if (color === '#FFD700') return 50 + Math.floor(Math.random() * 50); // 50+
    if (color === '#800080') return 10 + Math.floor(Math.random() * 10); // 10-20
    return 1 + Math.floor(Math.random() * 5); // 1-5
}

// Play Sound if not muted
function playSound(audio) {
    if (!isMuted) audio.play();
}

// Update Displays
function updateDisplays() {
    coinCountEl.textContent = coins;
    pointCountEl.textContent = points;
    gumballCountEl.textContent = gumballsCollected;
    localStorage.setItem('coins', coins);
    localStorage.setItem('points', points);
}

// Leaderboard Update
function updateLeaderboard() {
    leaderboard.push({ name: 'Player', score: points }); // Mock name; customize for input
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10); // Top 10
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    leaderboardList.innerHTML = leaderboard.map(entry => `<li>${entry.name}: ${entry.score}</li>`).join('');
}

// Insert Coin Logic
function insertCoin() {
    if (coins > 0) {
        coins--;
        coinInserted = true;
        turnBtn.disabled = false;
        playSound(coinClink);
        // Animate coin fall with GSAP
        gsap.to(virtualCoin, { y: 200, duration: 1, ease: 'bounce.out', onComplete: () => virtualCoin.style.top = '-100px' });
        updateDisplays();
    } else {
        alert('No coins left! Earn more via daily login or mini-games.'); // Placeholder for earning
    }
}

// Turn Handle Logic
function turnHandle() {
    if (coinInserted && inventory > 0) {
        coinInserted = false;
        turnBtn.disabled = true;
        playSound(crankSound);
        // Animate handle with GSAP
        gsap.to(handleEl, { rotation: 360, duration: 1, ease: 'power2.inOut', onComplete: dispenseGumball });
        // Machine shake
        gsap.to('#gumball-machine', { x: 5, duration: 0.1, repeat: 5, yoyo: true });
    } else if (inventory <= 0) {
        alert('Out of stock! Refill the machine.');
        refillBtn.disabled = false;
    }
}

// Dispense Gumball
function dispenseGumball() {
    inventory--;
    if (inventory <= 0) refillBtn.disabled = false;
    const gumball = addGumball(150, 0); // From top center
    playSound(gumballBounce);
    // Simulate fall to tray (remove from world after fall)
    setTimeout(() => {
        Matter.World.remove(world, gumball);
        const color = gumball.render.fillStyle;
        const earned = getPointsFromColor(color);
        points += earned;
        gumballsCollected++;
        updateDisplays();
        // Add to tray (simple div)
        const gumballEl = document.createElement('div');
        gumballEl.style.width = '20px';
        gumballEl.style.height = '20px';
        gumballEl.style.borderRadius = '50%';
        gumballEl.style.background = color;
        gumballEl.draggable = true; // Drag to collect
        trayEl.appendChild(gumballEl);
        // Jackpot if golden
        if (color === '#FFD700') {
            playSound(jackpotFanfare);
            confetti({ particleCount: 100, spread: 70 });
            navigator.vibrate && navigator.vibrate(200); // Vibration
        }
        // Drag to collect
        gumballEl.addEventListener('dragend', () => {
            gumballEl.remove();
            // Optional: add to inventory UI
        });
    }, 2000); // Time for fall
    updateLeaderboard();
}

// Refill Machine
function refill() {
    inventory = 50;
    for (let i = 0; i < 50; i++) {
        addGumball(Math.random() * 250 + 25, Math.random() * -100 - 50);
    }
    refillBtn.disabled = true;
    // Animation: swirl lights or something
    gsap.to('.machine-dome', { borderColor: '#FF0000', duration: 0.5, repeat: 3, yoyo: true });
}

// Mute Toggle
function toggleMute() {
    isMuted = !isMuted;
    muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
    if (isMuted) bgMusic.pause();
    else bgMusic.play();
}

// Dark Mode Toggle
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
}

// Drag Coin Setup
virtualCoin.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text', 'coin');
});
document.getElementById('coin-slot').addEventListener('dragover', (e) => e.preventDefault());
document.getElementById('coin-slot').addEventListener('drop', () => insertCoin());

// Event Listeners
insertBtn.addEventListener('click', insertCoin);
turnBtn.addEventListener('click', turnHandle);
refillBtn.addEventListener('click', refill);
muteBtn.addEventListener('click', toggleMute);
darkModeBtn.addEventListener('click', toggleDarkMode);

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') insertCoin();
    if (e.key === ' ') turnHandle();
});

// Init
window.addEventListener('load', () => {
    initPhysics();
    updateDisplays();
    updateLeaderboard();
    bgMusic.play();
    // Daily Login Bonus (simple)
    const lastLogin = localStorage.getItem('lastLogin');
    const today = new Date().toDateString();
    if (lastLogin !== today) {
        coins += 5;
        localStorage.setItem('lastLogin', today);
        updateDisplays();
        alert('Daily bonus: +5 coins!');
    }
    // ARIA Labels
    insertBtn.setAttribute('aria-label', 'Insert virtual coin');
    turnBtn.setAttribute('aria-label', 'Turn the handle to dispense gumball');
    // Easter Egg: Press 'G' for bonus coin
    document.addEventListener('keydown', (e) => {
        if (e.key === 'g') {
            coins++;
            updateDisplays();
            alert('Secret bonus coin!');
        }
    });
});

// Error Handling: Example for no coin
// Already in insertCoin

// Performance: Animations are optimized with GSAP/Matter.js

// Extensibility: Add Firebase here for real leaderboard
// e.g., import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
// Then use Firestore for scores.
