// Global Variables
let coins = parseInt(localStorage.getItem('coins')) || 10;
let prizesWon = 0; // Session-based, reset on refresh
let inventory = 9999; // Perpetually filled for testing
let coinInserted = false;
let prizes = []; // Session-based prize list

// Elements
const coinCountEl = document.getElementById('coin-count');
const prizeCountEl = document.getElementById('prize-count');
const insertBtn = document.getElementById('insert-coin-btn');
const turnBtn = document.getElementById('turn-handle-btn');
const trayEl = document.getElementById('tray');
const virtualCoin = document.getElementById('virtual-coin');
const handleEl = document.getElementById('handle');
const prizeList = document.getElementById('prize-list');
const prizePopup = document.getElementById('prize-popup');
const prizeMessage = document.getElementById('prize-message');
const sharePrizeBtn = document.getElementById('share-prize-btn');
const closePopupBtn = document.getElementById('close-popup-btn');

// Prize Types
const prizeTypes = [
    { name: '$CASINO Tokens', value: 10, color: '#FF0000' }, // Common
    { name: '$CASINO Tokens', value: 50, color: '#800080' }, // Uncommon
    { name: 'Casino Society NFT', value: 'NFT #1', color: '#FFD700' } // Rare
];

// Matter.js Physics Setup for Gumball Dome
let engine, render, runner, world;
function initPhysics() {
    try {
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

        // Dome boundaries (curved walls approximated with rectangles)
        Matter.World.add(world, [
            Matter.Bodies.rectangle(150, 290, 300, 20, { isStatic: true, render: { visible: false } }),
            Matter.Bodies.rectangle(10, 150, 20, 300, { isStatic: true, render: { visible: false } }),
            Matter.Bodies.rectangle(290, 150, 20, 300, { isStatic: true, render: { visible: false } })
        ]);

        // Initial Gumballs (visual pile, capped for performance)
        for (let i = 0; i < Math.min(inventory, 50); i++) {
            addGumball(Math.random() * 250 + 25, Math.random() * 50 + 50);
        }
    } catch (error) {
        console.error('Physics initialization failed:', error);
    }
}

// Add Gumball
function addGumball(x, y, color = getRandomColor()) {
    const gumball = Matter.Bodies.circle(x, y, 10, {
        restitution: 0.3, // Less bouncy for realistic piling
        friction: 0.1,
        render: { fillStyle: color }
    });
    Matter.World.add(world, gumball);
    return gumball;
}

// Random Color with Rarity
function getRandomColor() {
    const rand = Math.random();
    if (rand < 0.05) return '#FFD700'; // Rare
    if (rand < 0.3) return '#800080'; // Uncommon
    const commons = ['#FF0000', '#0000FF', '#008000', '#FFFF00'];
    return commons[Math.floor(Math.random() * commons.length)];
}

// Get Prize from Color
function getPrizeFromColor(color) {
    if (color === '#FFD700') return prizeTypes[2];
    if (color === '#800080') return prizeTypes[1];
    return prizeTypes[0];
}

// Update Displays
function updateDisplays() {
    coinCountEl.textContent = coins;
    prizeCountEl.textContent = prizesWon;
    localStorage.setItem('coins', coins);
    prizeList.innerHTML = prizes.map((prize, index) => `
        <div class="prize-item" style="background: ${prize.color}" role="presentation" aria-label="Prize: ${prize.name}, value ${prize.value}">
            ${prize.name}: ${prize.value}
        </div>
    `).join('');
}

// Show Prize Pop-up
function showPrizePopup(prize) {
    prizeMessage.textContent = `You won: ${prize.name} (${prize.value})!`;
    prizePopup.style.display = 'flex';
    gsap.fromTo(prizePopup, 
        { scale: 0, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 0.5, ease: 'elastic.out' }
    );
    confetti({
        particleCount: prize.color === '#FFD700' ? 200 : 100,
        spread: prize.color === '#FFD700' ? 100 : 70,
        colors: [prize.color, '#FFD700']
    });
    navigator.vibrate && navigator.vibrate(prize.color === '#FFD700' ? [200, 100, 200] : 200);
}

// Insert Coin Logic
function insertCoin() {
    if (coins <= 0) {
        alert('No coins left! Please add more coins to continue.');
        return;
    }
    coins--;
    coinInserted = true;
    turnBtn.disabled = false;
    console.log('Coin inserted, coins left:', coins);
    gsap.to(virtualCoin, {
        y: 200,
        x: 0,
        duration: 1,
        ease: 'bounce.out',
        onStart: () => virtualCoin.classList.add('dragging'),
        onComplete: () => {
            virtualCoin.classList.remove('dragging');
            virtualCoin.style.top = '50px';
            virtualCoin.style.left = '175px';
        }
    });
    updateDisplays();
}

// Turn Handle Logic
function turnHandle() {
    if (!coinInserted) {
        alert('Insert a coin first!');
        return;
    }
    coinInserted = false;
    turnBtn.disabled = true;
    console.log('Handle turned, dispensing gumball...');
    gsap.to(handleEl, {
        rotation: 360,
        duration: 1,
        ease: 'power2.inOut',
        onComplete: () => {
            handleEl.style.transform = 'rotate(0deg)';
            dispenseGumball();
        }
    });
    gsap.to('#gumball-machine', {
        x: 5,
        duration: 0.1,
        repeat: 5,
        yoyo: true,
        boxShadow: '0 0 30px var(--neon-glow)'
    });
}

// Dispense Gumball and Award Prize
function dispenseGumball() {
    inventory--;
    const color = getRandomColor();
    const gumball = addGumball(150, 0, color);
    // Animate gumball through chute
    gsap.to(gumball, {
        x: 160,
        y: 200,
        duration: 1.5,
        ease: 'power1.inOut',
        onUpdate: () => {
            Matter.Body.setPosition(gumball, { x: gumball.position.x, y: gumball.position.y });
        },
        onComplete: () => {
            try {
                Matter.World.remove(world, gumball);
                const prize = getPrizeFromColor(color);
                prizesWon++;
                prizes.push(prize);
                updateDisplays();
                // Add gumball to tray
                const gumballEl = document.createElement('div');
                gumballEl.className = 'prize-item';
                gumballEl.style.background = color;
                gumballEl.style.width = '20px';
                gumballEl.style.height = '20px';
                gumballEl.style.borderRadius = '50%';
                trayEl.appendChild(gumballEl);
                gsap.from(gumballEl, { scale: 0, duration: 0.5, ease: 'elastic.out' });
                setTimeout(() => {
                    gsap.to(gumballEl, { 
                        scale: 0, 
                        opacity: 0, 
                        duration: 0.5, 
                        onComplete: () => {
                            gumballEl.remove();
                            showPrizePopup(prize);
                        }
                    });
                }, 1000);
            } catch (error) {
                console.error('Dispense error:', error);
            }
        }
    });
}

// Drag Coin Setup
function setupDrag() {
    virtualCoin.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', 'coin');
        virtualCoin.classList.add('dragging');
    });
    virtualCoin.addEventListener('dragend', () => {
        virtualCoin.classList.remove('dragging');
    });
    const coinSlot = document.getElementById('coin-slot');
    coinSlot.addEventListener('dragover', (e) => {
        e.preventDefault();
        coinSlot.classList.add('dragover');
    });
    coinSlot.addEventListener('dragleave', () => {
        coinSlot.classList.remove('dragover');
    });
    coinSlot.addEventListener('drop', (e) => {
        e.preventDefault();
        coinSlot.classList.remove('dragover');
        insertCoin();
    });
}

// Social Sharing
function sharePrize(prize) {
    if (navigator.share) {
        navigator.share({
            title: 'Casino Society Prize',
            text: `I won ${prize.name} (${prize.value}) on the Casino Society Gumball Machine!`,
            url: window.location.href
        }).catch(error => console.error('Share error:', error));
    } else {
        alert('Sharing not supported on this browser. Copy the URL to share your prize!');
    }
}

// Event Listeners
insertBtn.addEventListener('click', insertCoin);
turnBtn.addEventListener('click', turnHandle);
closePopupBtn.addEventListener('click', () => {
    gsap.to(prizePopup, {
        scale: 0,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => prizePopup.style.display = 'none'
    });
});
sharePrizeBtn.addEventListener('click', () => {
    const latestPrize = prizes[prizes.length - 1];
    sharePrize(latestPrize);
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') insertCoin();
    if (e.key === ' ') turnHandle();
    if (e.key === 'Escape' && prizePopup.style.display === 'flex') {
        closePopupBtn.click();
    }
});

// Init
window.addEventListener('load', () => {
    console.log('Initializing gumball machine...');
    initPhysics();
    setupDrag();
    updateDisplays();
    // Easter Egg: Press 'G' for bonus coin
    document.addEventListener('keydown', (e) => {
        if (e.key === 'g') {
            coins++;
            updateDisplays();
            alert('Secret bonus coin!');
        }
    });
});
