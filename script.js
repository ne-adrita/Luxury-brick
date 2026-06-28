// ===== GSAP & AOS INIT =====
gsap.registerPlugin(ScrollTrigger);
AOS.init({
    duration: 1000,
    once: true,
    offset: 100,
    disable: 'mobile'
});

// ============================================
// 1. SOUND EFFECTS
// ============================================
class SoundFX {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        try {
            const oscillator = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            oscillator.connect(gain);
            gain.connect(this.ctx.destination);
            oscillator.type = type;
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            oscillator.start(this.ctx.currentTime);
            oscillator.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    }

    click() {
        this.playTone(800, 0.1, 'sine', 0.2);
    }

    coin() {
        this.playTone(1200, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(1500, 0.1, 'sine', 0.2), 100);
    }

    success() {
        [523, 659, 784].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.2), i * 100);
        });
    }

    error() {
        this.playTone(300, 0.3, 'sawtooth', 0.15);
    }
}

const sound = new SoundFX();

// ============================================
// 2. CUSTOM CURSOR
// ============================================
const cursor = document.querySelector('.custom-cursor');
const cursorTrail = document.querySelector('.cursor-trail');
let trailPositions = [];

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    
    trailPositions.push({ x: e.clientX, y: e.clientY });
    if (trailPositions.length > 10) trailPositions.shift();
    
    if (trailPositions.length > 0) {
        const last = trailPositions[trailPositions.length - 1];
        cursorTrail.style.left = last.x + 'px';
        cursorTrail.style.top = last.y + 'px';
    }
});

document.querySelectorAll('a, button, .feature-card, .testimonial-card, .game-brick').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

// ============================================
// 3. PARTICLES BACKGROUND
// ============================================
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particlesCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null };
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        this.createParticles();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        const count = Math.min(80, Math.floor(window.innerWidth / 20));
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2,
                color: Math.random() > 0.7 ? '#FFD700' : '#C0392B'
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            
            if (this.mouse.x && this.mouse.y) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    const force = (150 - dist) / 150 * 0.02;
                    p.x += dx * force;
                    p.y += dy * force;
                }
            }
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.opacity;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            
            if (p.color === '#FFD700') {
                this.ctx.shadowColor = '#FFD700';
                this.ctx.shadowBlur = 10;
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

const particles = new ParticleSystem();

// ============================================
// 4. THEME TOGGLE
// ============================================
const themeToggle = document.getElementById('themeToggle');
let isGoldTheme = false;

themeToggle.addEventListener('click', () => {
    isGoldTheme = !isGoldTheme;
    document.body.classList.toggle('gold-theme');
    themeToggle.innerHTML = isGoldTheme ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    sound.click();
});

// ============================================
// 5. 360° BRICK VIEWER
// ============================================
const brickViewer = document.getElementById('brickViewer');
let isDragging = false;
let prevX = 0;
let prevY = 0;
let rotateX = -20;
let rotateY = 30;

if (brickViewer) {
    const brick3d = brickViewer.querySelector('.brick-3d');
    
    brickViewer.addEventListener('mousedown', (e) => {
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        rotateY += dx * 0.5;
        rotateX += dy * 0.3;
        rotateX = Math.max(-80, Math.min(80, rotateX));
        brick3d.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        prevX = e.clientX;
        prevY = e.clientY;
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// ============================================
// 6. NAVIGATION
// ============================================
const navbar = document.querySelector('.navbar');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// ============================================
// 7. HERO ANIMATION
// ============================================
gsap.from('.hero-title', {
    duration: 1.5,
    y: 50,
    opacity: 0,
    ease: 'power3.out',
    delay: 0.5
});

gsap.from('.hero-subtitle', {
    duration: 1.5,
    y: 30,
    opacity: 0,
    ease: 'power3.out',
    delay: 0.8
});

gsap.from('.hero-actions', {
    duration: 1.5,
    y: 30,
    opacity: 0,
    ease: 'power3.out',
    delay: 1.1
});

gsap.from('.live-counter', {
    duration: 1.5,
    y: 30,
    opacity: 0,
    ease: 'power3.out',
    delay: 1.3
});

gsap.from('.floating-brick', {
    duration: 1.5,
    scale: 0.5,
    opacity: 0,
    rotation: 180,
    ease: 'power3.out',
    delay: 0.3
});

// ============================================
// 8. LIVE COUNTER
// ============================================
function updateLiveCounter() {
    const viewers = document.getElementById('viewers');
    const stockLeft = document.getElementById('stockLeft');
    const soldToday = document.getElementById('soldToday');
    
    setInterval(() => {
        const currentViewers = parseInt(viewers.textContent);
        const change = Math.floor(Math.random() * 6) - 3;
        let newViewers = currentViewers + change;
        newViewers = Math.max(180, Math.min(350, newViewers));
        viewers.textContent = newViewers;
        
        const currentStock = parseInt(stockLeft.textContent);
        if (currentStock > 0 && Math.random() < 0.05) {
            stockLeft.textContent = currentStock - 1;
            const currentSold = parseInt(soldToday.textContent);
            soldToday.textContent = currentSold + 1;
        }
    }, 3000);
}

updateLiveCounter();

// ============================================
// 9. COUNTER ANIMATION
// ============================================
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target + '+';
            }
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(counter);
    });
}

animateCounters();

// ============================================
// 10. WISHLIST BUTTON
// ============================================
const wishlistBtn = document.getElementById('wishlistBtn');
let isWishlisted = false;

wishlistBtn.addEventListener('click', () => {
    isWishlisted = !isWishlisted;
    wishlistBtn.classList.toggle('liked');
    sound.click();
    if (isWishlisted) {
        showToast('❤️ Saved to Collection');
    } else {
        showToast('Removed from Collection');
    }
});

// ============================================
// 11. TOAST NOTIFICATION
// ============================================
function showToast(message) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        toast.style.transition = 'all 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================
// 12. GAME TABS SWITCHING
// ============================================
document.querySelectorAll('.game-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.game-panel').forEach(p => p.classList.remove('active'));
        
        this.classList.add('active');
        const gameId = this.dataset.game;
        document.getElementById('game' + gameId.charAt(0).toUpperCase() + gameId.slice(1)).classList.add('active');
        sound.click();
    });
});

// ============================================
// 13. GAME 1: CATCH THE GOLDEN BRICK
// ============================================
class BrickGame {
    constructor() {
        this.score = 0;
        this.timeLeft = 30;
        this.highScore = parseInt(localStorage.getItem('brickHighScore')) || 0;
        this.isPlaying = false;
        this.gameInterval = null;
        this.brickInterval = null;
        this.gameArea = document.getElementById('gameArea');
        this.scoreDisplay = document.getElementById('score');
        this.timerDisplay = document.getElementById('timer');
        this.highScoreDisplay = document.getElementById('highScore');
        this.messageDisplay = document.getElementById('gameMessage');
        this.startBtn = document.getElementById('startGame');
        this.resetBtn = document.getElementById('resetGame');

        this.highScoreDisplay.textContent = this.highScore;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
    }

    startGame() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.score = 0;
        this.timeLeft = 30;
        this.scoreDisplay.textContent = '0';
        this.timerDisplay.textContent = '30';
        this.messageDisplay.style.display = 'none';
        this.startBtn.textContent = 'Playing...';
        this.startBtn.style.opacity = '0.5';
        this.startBtn.disabled = true;

        document.querySelectorAll('.game-brick').forEach(brick => brick.remove());

        this.gameInterval = setInterval(() => {
            this.timeLeft--;
            this.timerDisplay.textContent = this.timeLeft;

            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);

        this.spawnBrick();
        this.brickInterval = setInterval(() => this.spawnBrick(), 800);
        sound.click();
    }

    spawnBrick() {
        if (!this.isPlaying) return;

        const brick = document.createElement('div');
        const types = ['normal', 'golden', 'broken'];
        const weights = [0.6, 0.15, 0.25];
        let type = 'normal';
        let random = Math.random();
        let cumulative = 0;
        for (let i = 0; i < types.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
                type = types[i];
                break;
            }
        }

        brick.className = `game-brick ${type}`;
        brick.textContent = type === 'golden' ? '🌟' : type === 'broken' ? '💔' : '🧱';

        const maxX = this.gameArea.clientWidth - 80;
        const maxY = this.gameArea.clientHeight - 60;
        brick.style.left = Math.random() * maxX + 'px';
        brick.style.top = Math.random() * maxY + 'px';

        brick.addEventListener('click', () => {
            if (!this.isPlaying) return;
            let points = 0;
            if (type === 'golden') {
                points = 10;
                sound.coin();
                this.createParticles(brick);
            } else if (type === 'normal') {
                points = 2;
                sound.click();
            } else {
                points = -5;
                sound.error();
            }
            this.score += points;
            this.scoreDisplay.textContent = this.score;
            brick.remove();
        });

        this.gameArea.appendChild(brick);

        setTimeout(() => {
            if (brick.parentNode) {
                brick.remove();
            }
        }, 2000);
    }

    createParticles(brick) {
        const rect = brick.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
            particleCount: 30,
            spread: 60,
            origin: { x, y },
            colors: ['#FFD700', '#C0392B', '#F5F5F5']
        });
    }

    endGame() {
        this.isPlaying = false;
        clearInterval(this.gameInterval);
        clearInterval(this.brickInterval);
        document.querySelectorAll('.game-brick').forEach(brick => brick.remove());

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('brickHighScore', this.highScore);
            this.highScoreDisplay.textContent = this.highScore;
        }

        this.messageDisplay.style.display = 'block';
        this.messageDisplay.innerHTML = `
            <h3>🏆 ${this.score >= 50 ? 'Legendary Builder!' : this.score >= 20 ? 'Great Effort!' : 'Keep Practicing!'}</h3>
            <p style="font-size: 2rem; color: #FFD700; margin: 0.5rem 0;">Score: ${this.score}</p>
            <p style="font-size: 0.9rem;">${this.score >= this.highScore ? '🎉 New High Score!' : 'High Score: ${this.highScore}'}</p>
        `;

        this.startBtn.textContent = 'Play Again';
        this.startBtn.style.opacity = '1';
        this.startBtn.disabled = false;

        if (this.score >= 50) {
            this.createCelebration();
            sound.success();
        }
    }

    createCelebration() {
        const duration = 3 * 1000;
        const end = Date.now() + duration;
        (function frame() {
            confetti({
                particleCount: 7,
                startVelocity: 30,
                spread: 360,
                origin: { y: 0.6 }
            });
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        })();
    }

    resetGame() {
        if (this.isPlaying) {
            this.isPlaying = false;
            clearInterval(this.gameInterval);
            clearInterval(this.brickInterval);
        }
        document.querySelectorAll('.game-brick').forEach(brick => brick.remove());
        this.score = 0;
        this.timeLeft = 30;
        this.scoreDisplay.textContent = '0';
        this.timerDisplay.textContent = '30';
        this.messageDisplay.style.display = 'block';
        this.messageDisplay.innerHTML = `
            <h3>Game Reset</h3>
            <p>Click "Start Game" to begin</p>
        `;
        this.startBtn.textContent = 'Start Game';
        this.startBtn.style.opacity = '1';
        this.startBtn.disabled = false;
        sound.click();
    }
}

const game = new BrickGame();

// ============================================
// 14. GAME 2: MEMORY MATCH
// ============================================
class MemoryGame {
    constructor() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.isLocked = false;
        this.bestScore = parseInt(localStorage.getItem('memoryBest')) || Infinity;
        
        this.grid = document.getElementById('memoryGrid');
        this.movesDisplay = document.getElementById('memoryMoves');
        this.matchesDisplay = document.getElementById('memoryMatches');
        this.bestDisplay = document.getElementById('memoryBest');
        this.messageDisplay = document.getElementById('memoryMessage');
        this.startBtn = document.getElementById('startMemory');
        
        this.icons = ['🧱', '🏗️', '🏛️', '🕌', '🏰', '🗼', '🏯', '🏠'];
        this.bestDisplay.textContent = this.bestScore === Infinity ? '∞' : this.bestScore;
        
        this.startBtn.addEventListener('click', () => this.initGame());
    }
    
    initGame() {
        this.matchedPairs = 0;
        this.moves = 0;
        this.flippedCards = [];
        this.isLocked = false;
        this.movesDisplay.textContent = '0';
        this.matchesDisplay.textContent = '0';
        this.messageDisplay.style.display = 'none';
        
        const pairs = [...this.icons, ...this.icons];
        for (let i = pairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
        }
        
        this.cards = pairs;
        this.renderCards();
        sound.click();
    }
    
    renderCards() {
        this.grid.innerHTML = '';
        this.cards.forEach((icon, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.index = index;
            card.dataset.icon = icon;
            
            const back = document.createElement('span');
            back.className = 'card-back';
            back.textContent = '?';
            
            const content = document.createElement('span');
            content.className = 'card-content';
            content.textContent = icon;
            content.style.display = 'none';
            
            card.appendChild(back);
            card.appendChild(content);
            card.addEventListener('click', () => this.flipCard(card));
            this.grid.appendChild(card);
        });
    }
    
    flipCard(card) {
        if (this.isLocked) return;
        if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
        
        card.classList.add('flipped');
        card.querySelector('.card-back').style.display = 'none';
        card.querySelector('.card-content').style.display = 'block';
        sound.click();
        
        this.flippedCards.push(card);
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.movesDisplay.textContent = this.moves;
            this.checkMatch();
        }
    }
    
    checkMatch() {
        this.isLocked = true;
        const [card1, card2] = this.flippedCards;
        const icon1 = card1.dataset.icon;
        const icon2 = card2.dataset.icon;
        
        if (icon1 === icon2) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.matchedPairs++;
            this.matchesDisplay.textContent = this.matchedPairs;
            sound.coin();
            
            this.flippedCards = [];
            this.isLocked = false;
            
            if (this.matchedPairs === this.icons.length) {
                this.winGame();
            }
        } else {
            sound.error();
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                card1.querySelector('.card-back').style.display = 'block';
                card1.querySelector('.card-content').style.display = 'none';
                card2.querySelector('.card-back').style.display = 'block';
                card2.querySelector('.card-content').style.display = 'none';
                this.flippedCards = [];
                this.isLocked = false;
            }, 800);
        }
    }
    
    winGame() {
        const best = this.bestScore;
        if (this.moves < best) {
            this.bestScore = this.moves;
            localStorage.setItem('memoryBest', this.bestScore);
            this.bestDisplay.textContent = this.moves;
        }
        
        this.messageDisplay.style.display = 'block';
        this.messageDisplay.innerHTML = `
            <h3>🧱 Master Builder Unlocked!</h3>
            <p style="font-size: 1.5rem; color: #FFD700; margin: 0.5rem 0;">
                ${this.moves} moves
            </p>
            <p style="font-size: 0.9rem; color: rgba(245,245,245,0.6);">
                ${this.moves === this.bestScore ? '🏆 New Best Score!' : 'Best: ' + this.bestScore + ' moves'}
            </p>
            <button class="game-btn" onclick="memoryGame.initGame()" style="margin-top: 1rem;">
                Play Again
            </button>
        `;
        
        sound.success();
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

const memoryGame = new MemoryGame();

// ============================================
// 15. GAME 3: REACTION TEST
// ============================================
class ReactionTest {
    constructor() {
        this.state = 'idle';
        this.startTime = 0;
        this.reactionTime = 0;
        this.bestTime = parseInt(localStorage.getItem('reactionBest')) || Infinity;
        this.attempts = 0;
        this.timeoutId = null;
        this.isWaiting = false;
        
        this.box = document.getElementById('reactionBox');
        this.stateDisplay = document.getElementById('reactionState');
        this.timeDisplay = document.getElementById('reactionTime');
        this.bestDisplay = document.getElementById('reactionBest');
        this.attemptsDisplay = document.getElementById('reactionAttempts');
        this.startBtn = document.getElementById('startReaction');
        
        this.bestDisplay.textContent = this.bestTime === Infinity ? '--' : this.bestTime + 'ms';
        this.startBtn.addEventListener('click', () => this.startTest());
        
        this.box.addEventListener('click', () => this.handleClick());
    }
    
    startTest() {
        if (this.state === 'waiting' || this.state === 'ready') return;
        
        this.attempts++;
        this.attemptsDisplay.textContent = this.attempts;
        this.state = 'waiting';
        this.isWaiting = true;
        this.stateDisplay.innerHTML = `
            <h3>⏳ Wait for it...</h3>
            <p>Don't click yet!</p>
        `;
        this.box.className = 'reaction-box waiting';
        sound.click();
        
        const delay = 2000 + Math.random() * 3000;
        this.timeoutId = setTimeout(() => {
            this.state = 'ready';
            this.isWaiting = false;
            this.startTime = Date.now();
            this.stateDisplay.innerHTML = `
                <h3>🔥 Click Now!</h3>
                <p>Quick! Tap the golden brick!</p>
            `;
            this.box.className = 'reaction-box go';
            sound.coin();
        }, delay);
    }
    
    handleClick() {
        if (this.state === 'idle') return;
        
        if (this.state === 'waiting') {
            this.state = 'idle';
            this.isWaiting = false;
            clearTimeout(this.timeoutId);
            this.stateDisplay.innerHTML = `
                <h3>❌ Too Early!</h3>
                <p>Wait for the golden brick!</p>
                <button class="game-btn" onclick="reactionTest.startTest()">Try Again</button>
            `;
            this.box.className = 'reaction-box';
            sound.error();
            return;
        }
        
        if (this.state === 'ready') {
            this.state = 'result';
            this.reactionTime = Date.now() - this.startTime;
            this.timeDisplay.textContent = this.reactionTime + 'ms';
            
            if (this.reactionTime < this.bestTime) {
                this.bestTime = this.reactionTime;
                localStorage.setItem('reactionBest', this.bestTime);
                this.bestDisplay.textContent = this.bestTime + 'ms';
            }
            
            const isExcellent = this.reactionTime < 200;
            const isGood = this.reactionTime < 350;
            
            this.stateDisplay.innerHTML = `
                <h3>${isExcellent ? '🏆' : isGood ? '⭐' : '💪'} ${this.reactionTime}ms</h3>
                <p style="color: ${isExcellent ? '#FFD700' : isGood ? '#2ECC71' : '#F5F5F5'};">
                    ${isExcellent ? 'Legendary Reflexes!' : isGood ? 'Great Builder!' : 'Keep Practicing!'}
                </p>
                <p style="font-size: 0.8rem; color: rgba(245,245,245,0.4);">
                    Best: ${this.bestTime}ms
                </p>
                <button class="game-btn" onclick="reactionTest.startTest()">Test Again</button>
            `;
            this.box.className = 'reaction-box result';
            sound.success();
            
            if (isExcellent) {
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.6 }
                });
            }
        }
    }
}

const reactionTest = new ReactionTest();

// ============================================
// 16. BUY BUTTON WITH FIREWORKS
// ============================================
document.getElementById('buyBtn').addEventListener('click', function() {
    sound.success();
    this.classList.add('buying');
    
    const duration = 4 * 1000;
    const end = Date.now() + duration;
    (function frame() {
        confetti({
            particleCount: 15,
            startVelocity: 45,
            spread: 360,
            origin: { y: 0.6 }
        });
        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
    
    setTimeout(() => {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const x = Math.random();
                const y = Math.random() * 0.5;
                confetti({
                    particleCount: 50,
                    spread: 100,
                    origin: { x, y },
                    colors: ['#FFD700', '#C0392B', '#F5F5F5', '#FF6B6B']
                });
            }, i * 300);
        }
    }, 500);
    
    document.body.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 500);

    this.innerHTML = '✓ ORDER CONFIRMED!';
    this.style.background = 'linear-gradient(135deg, #27AE60, #2ECC71)';
    setTimeout(() => {
        this.innerHTML = '<i class="fas fa-crown"></i> BUY THE LEGEND <i class="fas fa-arrow-right"></i>';
        this.style.background = '';
        this.classList.remove('buying');
    }, 4000);

    showToast('🎉 Order Confirmed! Welcome to the LUXBRICK family!');
});

// ============================================
// 17. SCRATCH CARD
// ============================================
const scratchBtn = document.getElementById('scratchBtn');
const scratchModal = document.getElementById('scratchModal');
const scratchClose = document.getElementById('scratchClose');

scratchBtn.addEventListener('click', () => {
    scratchModal.style.display = 'flex';
    sound.click();
    initScratchCard();
});

scratchClose.addEventListener('click', () => {
    scratchModal.style.display = 'none';
});

scratchModal.addEventListener('click', (e) => {
    if (e.target === scratchModal) {
        scratchModal.style.display = 'none';
    }
});

function initScratchCard() {
    const canvas = document.getElementById('scratchCanvas');
    const cover = document.getElementById('scratchCover');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    
    let isDrawing = false;
    let hasRevealed = false;
    
    ctx.fillStyle = '#C0392B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgba(255,215,0,${Math.random() * 0.2})`;
        ctx.beginPath();
        ctx.arc(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 5,
            0, Math.PI * 2
        );
        ctx.fill();
    }
    
    function getPosition(e) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        return { x, y };
    }
    
    function scratch(e) {
        e.preventDefault();
        if (!isDrawing || hasRevealed) return;
        
        const pos = getPosition(e);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
        ctx.fill();
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let transparent = 0;
        const total = pixels.length / 4;
        
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] === 0) transparent++;
        }
        
        if (transparent / total > 0.4) {
            hasRevealed = true;
            cover.classList.add('revealed');
            sound.success();
            showToast('🎉 You unlocked 50% OFF!');
            
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }
    
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        scratch(e);
    });
    
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('mouseup', () => { isDrawing = false; });
    canvas.addEventListener('mouseleave', () => { isDrawing = false; });
    
    canvas.addEventListener('touchstart', (e) => {
        isDrawing = true;
        scratch(e);
    });
    canvas.addEventListener('touchmove', scratch);
    canvas.addEventListener('touchend', () => { isDrawing = false; });
}

// ============================================
// 18. SMOOTH SCROLL
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ============================================
// 19. SCROLL ANIMATIONS
// ============================================
gsap.utils.toArray('.feature-card').forEach((card, i) => {
    gsap.from(card, {
        scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            toggleActions: 'play none none none'
        },
        duration: 0.8,
        y: 50,
        opacity: 0,
        delay: i * 0.1,
        ease: 'power3.out'
    });
});

gsap.utils.toArray('.testimonial-card').forEach((card, i) => {
    gsap.from(card, {
        scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            toggleActions: 'play none none none'
        },
        duration: 0.8,
        y: 50,
        opacity: 0,
        delay: i * 0.15,
        ease: 'power3.out'
    });
});

// ============================================
// 20. KEYBOARD SHORTCUTS (Bonus)
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'g' || e.key === 'G') {
        // Toggle gold theme
        themeToggle.click();
    }
    if (e.key === 'r' || e.key === 'R') {
        // Reset game if on game section
        if (document.getElementById('gameCatch').classList.contains('active')) {
            game.resetGame();
        }
    }
});

console.log('🧱 LUXBRICK™ - The Brick That Built Legends');
console.log('✦ Premium Features:');
console.log('  • 360° Brick Viewer');
console.log('  • Live Counter');
console.log('  • Theme Toggle (Press G)');
console.log('  • Particle System');
console.log('  • Custom Cursor');
console.log('  • Scratch Card');
console.log('  • Wishlist');
console.log('  • Sound Effects');
console.log('  • 3 Games in 1');
console.log('  • Fireworks & Confetti');
console.log('✦ Built for Grameenphone Academy - Top 80!');
console.log('✦ Keyboard Shortcuts: G = Theme Toggle, R = Reset Game');