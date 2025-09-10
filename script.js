// Expert-level code with extensive comments for user customization

// Global Variables
let coins = parseInt(localStorage.getItem('coins')) || 10; // Start with 10 coins
let points = parseInt(localStorage.getItem('points')) || 0;
let prizesWon = 0;
let inventory = 50; // Initial gumballs in machine
let coinInserted = false;
let prizes = JSON.parse(localStorage.getItem('prizes')) || []; // Store prizes

// Elements
const coinCountEl = document.getElementById('coin-count');
const pointCountEl = document.getElementById('point-count');
const prizeCountEl = document.getElementById('prize-count');
const insertBtn = document.getElementById('insert-coin-btn');
const turnBtn = document.getElementById('turn-handle-btn');
const refillBtn = document.getElementById('refill-btn');
const trayEl = document.getElementById('tray');
const virtualCoin = document.getElementById('virtual-coin');
const handleEl = document.getElementById('handle');
const prizeList = document.getElementById('prize-list');

// Prize Types
const prizeTypes = [
    { name: 'Casino Chip', value: 10, rarity: 'common', color: '#FF0000' },
    { name: 'Ace of Spades', value: 20, rarity: 'uncommon', color: '#800080' },
    { name: 'Golden Voucher', value: 50, rarity: 'rare', color: '#FFD700' }
];

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

// Get Prize from Color
function getPrizeFromColor(color) {
    if (color === '#FFD700') return prizeTypes[2]; // Golden Voucher
    if (color === '#800080') return prizeTypes[1]; // Ace of Spades
    return prizeTypes[0]; // Casino Chip
}

// Update Displays
function updateDisplays() {
    coinCountEl.textContent = coins;
    pointCountEl.textContent = points;
    prizeCountEl.textContent = prizesWon;
    localStorage.setItem('coins', coins);
    localStorage.setItem('points', points);
    localStorage.setItem('prizes', JSON.stringify(prizes));
    // Update Prize Inventory
    prizeList.innerHTML = prizes.map((prize, index) => `
        <div class="prize-item" style="background: ${prize.color}" data-index="${index}">
            ${prize.name}<br>Value: ${prize.value}
        </div>
    `).join('');
}

// Insert Coin Logic
function insertCoin() {
    if (coins > 0) {
        coins--;
        coinInserted = true;
        turnBtn.disabled = false;
        // Animate coin fall with GSAP
        gsap.to(virtualCoin, { y: 200, duration: 1, ease: 'bounce.out', onComplete: () => virtualCoin.style.top = '-100px' });
        updateDisplays();
    } else {
        alert('No coins left! Earn more via daily login or mini-games.'); // Placeholder for earning
    }
}

// Slot Machine Animation for Prize Reveal
function showSlotMachineReveal(prize) {
    let slotEl = document.getElementById('slot-machine-reveal');
    if (!slotEl) {
        slotEl = document.createElement('div');
        slotEl.id = 'slot-machine-reveal';
        document.body.appendChild(slotEl);
    }
    slotEl.style.display = 'block';
    let count = 0;
    const words = ['Spin!', 'Win!', prize.name];
    const interval = setInterval(() => {
        slotEl.textContent = words[count % words.length];
        count++;
        if (count > 10) { // Simulate slot spin for ~2 seconds
            clearInterval(interval);
            slotEl.textContent = `You won: ${prize.name}!`;
            gsap.to(slotEl, { scale: 1.2, duration: 0.5, yoyo: true, repeat: 1, onComplete: () => {
                gsap.to(slotEl, { opacity: 0, duration: 0.5, onComplete: () => slotEl.style.display = 'none' });
            }});
            // Enhanced confetti for rare prizes
            confetti({
                particleCount: prize.rarity === 'rare' ? 200 : 100,
                spread: prize.rarity === 'rare' ? 100 : 70,
                colors: [prize.color, '#FFD700']
            });
            navigator.vibrate && navigator.vibrate(200); // Vibration
        }
    }, 200);
}

// Turn Handle Logic
function turnHandle() {
    if (coinInserted && inventory > 0) {
        coinInserted = false;
        turnBtn.disabled = true;
        // Animate handle with GSAP
        gsap.to(handleEl, { rotation: 360, duration: 1, ease: 'power2.inOut', onComplete: dispenseGumball });
        // Machine shake with glow
        gsap.to('#gumball-machine', { 
            x: 5, 
            duration: 0.1, 
            repeat: 5, 
            yoyo: true,
            boxShadow: '0 0 30px var(--neon-glow)'
        });
    } else if (inventory <= 0) {
        alert('Out of stock! Refill the machine.');
        refillBtn.disabled = false;
    }
}

// Dispense Gumball and Award Prize
function dispenseGumball() {
    inventory--;
    if (inventory <= 0) refillBtn.disabled = false;
    const gumball = addGumball(150, 0); // From top center
    // Simulate fall to tray (remove from world after fall)
    setTimeout(() => {
        Matter.World.remove(world, gumball);
        const color = gumball.render.fillStyle;
        const prize = getPrizeFromColor(color);
        points += prize.value;
        prizesWon++;
        prizes.push(prize);
        updateDisplays();
        // Show slot machine reveal
        showSlotMachineReveal(prize);
        // Add to tray (visual only, auto-collected)
        const prizeEl = document.createElement('div');
        prizeEl.className = 'prize-item';
        prizeEl.style.background = color;
        prizeEl.textContent = prize.name;
        trayEl.appendChild(prizeEl);
        gsap.from(prizeEl, { scale: 0, duration: 0.5, ease: 'elastic.out' });
        setTimeout(() => prizeEl.remove(), 2000); // Remove from tray after animation
    }, 2000); // Time for fall
}

// Refill Machine
function refill() {
    inventory = 50;
    for (let i = 0; i < 50; i++) {
        addGumball(Math.random() * 250 + 25, Math.random() * -100 - 50);
    }
    refillBtn.disabled = true;
    // Animation: swirl lights
    gsap.to('.machine-dome', { borderColor: '#FF0000', duration: 0.5, repeat: 3, yoyo: true });
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

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') insertCoin();
    if (e.key === ' ') turnHandle();
});

// Init
window.addEventListener('load', () => {
    initPhysics();
    updateDisplays();
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
    turnBtn.setAttribute('aria-label', 'Turn the handle to dispense prize');
    // Easter Egg: Press 'G' for bonus coin
    document.addEventListener('keydown', (e) => {
        if (e.key === 'g') {
            coins++;
            updateDisplays();
            alert('Secret bonus coin!');
        }
    });
});

// Extensibility: Add Firebase here for real prize tracking
// e.g., import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
// Then use Firestore for prizes.
