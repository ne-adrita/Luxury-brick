// ===== GSAP & AOS INIT =====
gsap.registerPlugin(ScrollTrigger);
AOS.init({
    duration: 800,
    once: true,
    offset: 50,
    disable: 'mobile'
});

// Three.js state objects (pre-initialized for GSAP integration)
window.threeBricks = {
    hero: { rotationX: -25, rotationY: -30, scale: 0.4 },
    story: { rotationX: -10, rotationY: 0, scale: 1 },
    premium: { rotationX: -10, rotationY: 40, scale: 0.7 },
    showcase: { rotationX: -10, rotationY: 30, scale: 0.9 }
};

// AOS রিফ্রেশ (নিশ্চিত করে যে সব element visible)
setTimeout(() => {
    AOS.refresh();
}, 100);

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
// 2. PARTICLES BACKGROUND
// ============================================
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particlesCanvas');
        if (!this.canvas) return;
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
        const count = Math.min(60, Math.floor(window.innerWidth / 25));
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2.5 + 0.5,
                speedX: (Math.random() - 0.5) * 0.4,
                speedY: (Math.random() - 0.5) * 0.4,
                opacity: Math.random() * 0.4 + 0.1,
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
                this.ctx.shadowBlur = 8;
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

const particles = new ParticleSystem();

// ============================================
// 3. THEME TOGGLE (Dark ↔ Gold)
// ============================================
const themeToggle = document.getElementById('themeToggle');
let isGoldTheme = false;

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        isGoldTheme = !isGoldTheme;
        document.body.classList.toggle('gold-theme');
        themeToggle.innerHTML = isGoldTheme ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        sound.click();
        
        // Update loader color if visible
        const loader = document.getElementById('loader');
        if (loader && loader.style.display !== 'none') {
            loader.style.background = isGoldTheme ? '#FFF8F0' : '#0B0B0B';
        }
    });
}

// ============================================
// 4. 360° BRICK VIEWER (Three.js State)
// ============================================
const brickViewer = document.getElementById('brickViewer');
let isDragging = false;
let prevX = 0;
let prevY = 0;
let dragRotateX = -10;
let dragRotateY = 15;

if (brickViewer) {
    brickViewer.addEventListener('mousedown', (e) => {
        if (!heroReady) return;
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
        dragRotateX = heroState.rotationX;
        dragRotateY = heroState.rotationY;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        dragRotateY += dx * 0.5;
        dragRotateX += dy * 0.3;
        dragRotateX = Math.max(-80, Math.min(80, dragRotateX));
        heroState.rotationX = dragRotateX;
        heroState.rotationY = dragRotateY;
        prevX = e.clientX;
        prevY = e.clientY;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// ============================================
// 5. NAVIGATION
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

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        if (hamburger) hamburger.classList.remove('active');
        if (navMenu) navMenu.classList.remove('active');
    });
});

// ============================================
// 6. HERO ANIMATION
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

const heroState = window.threeBricks.hero;
const heroBrickReveal = gsap.timeline({ delay: 0.2 });

heroBrickReveal
    .set('.hero-brick', { opacity: 0 })
    .to('.hero-brick', { opacity: 1, duration: 0.3 })
    .to(heroState, {
        rotationX: -10,
        rotationY: 15,
        scale: 1,
        duration: 1.6,
        ease: 'power4.out'
    }, '-=0.1')
    .to('.hero-brick-container', {
        duration: 3.5,
        y: -5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
    }, '+=0.6');

// ============================================
// HERO BRICK - MOUSE FOLLOW (Three.js State)
// ============================================
const heroContainer = document.querySelector('.hero-brick-container');
const heroBrick = document.querySelector('.hero-brick');
let heroReady = false;

heroBrickReveal.eventCallback('onComplete', () => {
    heroReady = true;
});

if (heroContainer && heroBrick) {
    heroContainer.addEventListener('mousemove', (e) => {
        if (!heroReady) return;
        const rect = heroContainer.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        heroState.rotationX = -10 + (-y * 12);
        heroState.rotationY = 15 + (x * 18);
    });

    heroContainer.addEventListener('mouseleave', () => {
        if (!heroReady) return;
        heroState.rotationX = -10;
        heroState.rotationY = 15;
    });
}

// ============================================
// 7. LIVE COUNTER
// ============================================
function updateLiveCounter() {
    const viewers = document.getElementById('viewers');
    const stockLeft = document.getElementById('stockLeft');
    const soldToday = document.getElementById('soldToday');
    
    if (!viewers || !stockLeft || !soldToday) return;
    
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
// 8. COUNTER ANIMATION
// ============================================
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        if (!target) return;
        
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
        }, { threshold: 0.3 });

        observer.observe(counter);
    });
}

animateCounters();

// ============================================
// 9. WISHLIST BUTTON
// ============================================
const wishlistBtn = document.getElementById('wishlistBtn');
let isWishlisted = false;

if (wishlistBtn) {
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
}

// ============================================
// 10. TOAST NOTIFICATION
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
// 11. GAME TABS SWITCHING
// ============================================
document.querySelectorAll('.game-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.game-panel').forEach(p => p.classList.remove('active'));
        
        this.classList.add('active');
        const gameId = this.dataset.game;
        const targetPanel = document.getElementById('game' + gameId.charAt(0).toUpperCase() + gameId.slice(1));
        if (targetPanel) targetPanel.classList.add('active');
        sound.click();
    });
});

// ============================================
// 12. GAME 1: CATCH THE GOLDEN BRICK
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

        if (this.highScoreDisplay) this.highScoreDisplay.textContent = this.highScore;
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.startBtn) this.startBtn.addEventListener('click', () => this.startGame());
        if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.resetGame());
    }

    startGame() {
        if (this.isPlaying || !this.gameArea) return;
        this.isPlaying = true;
        this.score = 0;
        this.timeLeft = 30;
        if (this.scoreDisplay) this.scoreDisplay.textContent = '0';
        if (this.timerDisplay) this.timerDisplay.textContent = '30';
        if (this.messageDisplay) this.messageDisplay.style.display = 'none';
        if (this.startBtn) {
            this.startBtn.textContent = 'Playing...';
            this.startBtn.style.opacity = '0.5';
            this.startBtn.disabled = true;
        }

        document.querySelectorAll('.game-brick').forEach(brick => brick.remove());

        this.gameInterval = setInterval(() => {
            this.timeLeft--;
            if (this.timerDisplay) this.timerDisplay.textContent = this.timeLeft;

            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);

        this.spawnBrick();
        this.brickInterval = setInterval(() => this.spawnBrick(), 800);
        sound.click();
    }

    spawnBrick() {
        if (!this.isPlaying || !this.gameArea) return;

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

        const maxX = this.gameArea.clientWidth - 70;
        const maxY = this.gameArea.clientHeight - 50;
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
            if (this.scoreDisplay) this.scoreDisplay.textContent = this.score;
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
            if (this.highScoreDisplay) this.highScoreDisplay.textContent = this.highScore;
        }

        if (this.messageDisplay) {
            this.messageDisplay.style.display = 'block';
            this.messageDisplay.innerHTML = `
                <h3>🏆 ${this.score >= 50 ? 'Legendary Builder!' : this.score >= 20 ? 'Great Effort!' : 'Keep Practicing!'}</h3>
                <p style="font-size: 2rem; color: #FFD700; margin: 0.5rem 0;">Score: ${this.score}</p>
                <p style="font-size: 0.9rem;">${this.score >= this.highScore ? '🎉 New High Score!' : 'High Score: ' + this.highScore}</p>
            `;
        }

        if (this.startBtn) {
            this.startBtn.textContent = 'Play Again';
            this.startBtn.style.opacity = '1';
            this.startBtn.disabled = false;
        }

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
        if (this.scoreDisplay) this.scoreDisplay.textContent = '0';
        if (this.timerDisplay) this.timerDisplay.textContent = '30';
        if (this.messageDisplay) {
            this.messageDisplay.style.display = 'block';
            this.messageDisplay.innerHTML = `
                <h3>Game Reset</h3>
                <p>Click "Start Game" to begin</p>
            `;
        }
        if (this.startBtn) {
            this.startBtn.textContent = 'Start Game';
            this.startBtn.style.opacity = '1';
            this.startBtn.disabled = false;
        }
        sound.click();
    }
}

const game = new BrickGame();

// ============================================
// 13. GAME 2: MEMORY MATCH (পুরোপুরি ফিক্সড)
// ============================================
class MemoryGame {
    constructor() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.isLocked = false;
        this.bestScore = parseInt(localStorage.getItem('memoryBest')) || Infinity;
        this.isGameActive = false;
        
        this.grid = document.getElementById('memoryGrid');
        this.movesDisplay = document.getElementById('memoryMoves');
        this.matchesDisplay = document.getElementById('memoryMatches');
        this.bestDisplay = document.getElementById('memoryBest');
        this.messageDisplay = document.getElementById('memoryMessage');
        this.startBtn = document.getElementById('startMemoryBtn');
        this.resetBtn = document.getElementById('resetMemoryBtn');
        
        this.icons = ['🧱', '🏗️', '🏛️', '🕌', '🏰', '🗼', '🏯', '🏠'];
        if (this.bestDisplay) {
            this.bestDisplay.textContent = this.bestScore === Infinity ? '∞' : this.bestScore;
        }
        
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.initGame());
        }
        
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetGame());
        }
    }
    
    initGame() {
        this.isGameActive = true;
        this.matchedPairs = 0;
        this.moves = 0;
        this.flippedCards = [];
        this.isLocked = false;
        if (this.movesDisplay) this.movesDisplay.textContent = '0';
        if (this.matchesDisplay) this.matchesDisplay.textContent = '0';
        if (this.messageDisplay) this.messageDisplay.style.display = 'none';
        
        // Start button change - Game 1 এর মত
        if (this.startBtn) {
            this.startBtn.textContent = 'Playing...';
            this.startBtn.style.opacity = '0.5';
            this.startBtn.disabled = true;
        }
        
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
        if (!this.grid) return;
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
        if (!this.isGameActive) return;
        if (this.isLocked) return;
        if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
        
        card.classList.add('flipped');
        card.querySelector('.card-back').style.display = 'none';
        card.querySelector('.card-content').style.display = 'block';
        sound.click();
        
        this.flippedCards.push(card);
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            if (this.movesDisplay) this.movesDisplay.textContent = this.moves;
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
            if (this.matchesDisplay) this.matchesDisplay.textContent = this.matchedPairs;
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
        this.isGameActive = false;
        const best = this.bestScore;
        if (this.moves < best) {
            this.bestScore = this.moves;
            localStorage.setItem('memoryBest', this.bestScore);
            if (this.bestDisplay) this.bestDisplay.textContent = this.moves;
        }
        
        // Game 1 এর মত Start Button কে "Play Again" এ পরিবর্তন
        if (this.startBtn) {
            this.startBtn.textContent = 'Play Again';
            this.startBtn.style.opacity = '1';
            this.startBtn.disabled = false;
        }
        
        if (this.messageDisplay) {
            this.messageDisplay.style.display = 'block';
            this.messageDisplay.innerHTML = `
                <h3>🧱 Master Builder Unlocked!</h3>
                <p style="font-size: 2rem; color: #FFD700; margin: 0.5rem 0;">
                    ${this.moves} moves
                </p>
                <p style="font-size: 0.9rem; color: rgba(245,245,245,0.6);">
                    ${this.moves === this.bestScore || this.bestScore === Infinity ? '🏆 New Best Score!' : 'Best: ' + this.bestScore + ' moves'}
                </p>
            `;
        }
        
        sound.success();
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
    
    resetGame() {
        if (this.isGameActive) {
            this.isGameActive = false;
        }
        // Reset all cards
        if (this.grid) {
            this.grid.innerHTML = '';
        }
        if (this.movesDisplay) this.movesDisplay.textContent = '0';
        if (this.matchesDisplay) this.matchesDisplay.textContent = '0';
        
        // Game 1 এর মত Start Button কে "Start Game" এ পরিবর্তন
        if (this.startBtn) {
            this.startBtn.textContent = 'Start Game';
            this.startBtn.style.opacity = '1';
            this.startBtn.disabled = false;
        }
        
        // Show start message
        if (this.messageDisplay) {
            this.messageDisplay.style.display = 'block';
            this.messageDisplay.innerHTML = `
                <h3>🧱 Memory Match</h3>
                <p>Find the matching brick pairs!</p>
            `;
        }
        sound.click();
    }
}

const memoryGame = new MemoryGame();

// ============================================
// 14. GAME 3: REACTION TEST
// ============================================
class ReactionTest {
    constructor() {
        this.state = 'idle';
        this.startTime = 0;
        this.reactionTime = 0;
        this.bestTime = parseInt(localStorage.getItem('reactionBest')) || Infinity;
        this.attempts = 0;
        this.timeoutId = null;
        
        this.box = document.getElementById('reactionBox');
        this.stateDisplay = document.getElementById('reactionState');
        this.timeDisplay = document.getElementById('reactionTime');
        this.bestDisplay = document.getElementById('reactionBest');
        this.attemptsDisplay = document.getElementById('reactionAttempts');
        this.startBtn = document.getElementById('startReaction');
        
        if (this.bestDisplay) {
            this.bestDisplay.textContent = this.bestTime === Infinity ? '--' : this.bestTime + 'ms';
        }
        if (this.startBtn) {
            this.startBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.startTest();
            });
        }
        
        if (this.box) {
            this.box.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleClick();
            });
        }
    }
    
    startTest() {
        if (this.state === 'waiting' || this.state === 'ready') return;
        
        this.attempts++;
        if (this.attemptsDisplay) this.attemptsDisplay.textContent = this.attempts;
        this.state = 'waiting';
        if (this.stateDisplay) {
            this.stateDisplay.innerHTML = `
                <h3>⏳ Wait for it...</h3>
                <p style="font-size: 0.8rem; color: rgba(245,245,245,0.5);">Don't click yet!</p>
            `;
        }
        if (this.box) {
            this.box.className = 'reaction-box waiting';
        }
        sound.click();
        
        const delay = 2000 + Math.random() * 3000;
        this.timeoutId = setTimeout(() => {
            this.state = 'ready';
            this.startTime = Date.now();
            if (this.stateDisplay) {
                this.stateDisplay.innerHTML = `
                    <h3>🔥 Click Now!</h3>
                    <p style="font-size: 0.9rem; color: #FFD700;">Quick! Tap the golden brick!</p>
                `;
            }
            if (this.box) {
                this.box.className = 'reaction-box go';
            }
            sound.coin();
        }, delay);
    }
    
    handleClick() {
        if (this.state === 'idle') return;
        
        if (this.state === 'waiting') {
            this.state = 'idle';
            clearTimeout(this.timeoutId);
            if (this.stateDisplay) {
                this.stateDisplay.innerHTML = `
                    <h3>❌ Too Early!</h3>
                    <p style="font-size: 0.8rem; color: rgba(245,245,245,0.5);">Wait for the golden brick!</p>
                    <button class="game-btn" id="reactionRetry" style="margin-top: 0.5rem; padding: 0.5rem 1.5rem; font-size: 0.8rem;">
                        Try Again
                    </button>
                `;
            }
            if (this.box) {
                this.box.className = 'reaction-box';
            }
            sound.error();
            
            const retryBtn = document.getElementById('reactionRetry');
            if (retryBtn) {
                retryBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.startTest();
                });
            }
            return;
        }
        
        if (this.state === 'ready') {
            this.state = 'result';
            this.reactionTime = Date.now() - this.startTime;
            if (this.timeDisplay) this.timeDisplay.textContent = this.reactionTime + 'ms';
            
            if (this.reactionTime < this.bestTime) {
                this.bestTime = this.reactionTime;
                localStorage.setItem('reactionBest', this.bestTime);
                if (this.bestDisplay) this.bestDisplay.textContent = this.bestTime + 'ms';
            }
            
            const isExcellent = this.reactionTime < 200;
            const isGood = this.reactionTime < 350;
            
            if (this.stateDisplay) {
                this.stateDisplay.innerHTML = `
                    <h3>${isExcellent ? '🏆' : isGood ? '⭐' : '💪'} ${this.reactionTime}ms</h3>
                    <p style="color: ${isExcellent ? '#FFD700' : isGood ? '#2ECC71' : '#F5F5F5'}; font-size: 0.9rem;">
                        ${isExcellent ? 'Legendary Reflexes!' : isGood ? 'Great Builder!' : 'Keep Practicing!'}
                    </p>
                    <p style="font-size: 0.7rem; color: rgba(245,245,245,0.3);">
                        Best: ${this.bestTime}ms
                    </p>
                    <button class="game-btn" id="reactionAgain" style="margin-top: 0.5rem; padding: 0.5rem 1.5rem; font-size: 0.8rem;">
                        Test Again
                    </button>
                `;
            }
            if (this.box) {
                this.box.className = 'reaction-box result';
            }
            sound.success();
            
            const againBtn = document.getElementById('reactionAgain');
            if (againBtn) {
                againBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.startTest();
                });
            }
            
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
// 15. CART SYSTEM
// ============================================
class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('luxbrick-cart')) || [];
        this.cartBtn = document.getElementById('cartBtn');
        this.cartCount = document.getElementById('cartCount');
        this.cartModal = document.getElementById('cartModal');
        this.cartItems = document.getElementById('cartItems');
        this.cartFooter = document.getElementById('cartFooter');
        this.cartTotal = document.getElementById('cartTotal');
        this.cartClose = document.getElementById('cartClose');
        this.checkoutBtn = document.getElementById('checkoutBtn');
        this.heroAddCartBtn = document.getElementById('heroAddCartBtn');

        this.init();
    }

    init() {
        this.updateUI();

        if (this.cartBtn) {
            this.cartBtn.addEventListener('click', () => this.openCart());
        }
        if (this.cartClose) {
            this.cartClose.addEventListener('click', () => this.closeCart());
        }
        if (this.cartModal) {
            this.cartModal.addEventListener('click', (e) => {
                if (e.target === this.cartModal) this.closeCart();
            });
        }
        if (this.heroAddCartBtn) {
            this.heroAddCartBtn.addEventListener('click', () => {
                this.addItem('LUXBRICK™', 15, '🧱');
                this.animateAddButton(this.heroAddCartBtn);
            });
        }

        if (this.checkoutBtn) {
            this.checkoutBtn.addEventListener('click', () => this.checkout());
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeCart();
        });
    }

    addItem(name, price, icon = '🧱') {
        const existing = this.items.find(i => i.name === name);
        if (existing) {
            existing.qty += 1;
        } else {
            this.items.push({ name, price, icon, qty: 1 });
        }
        this.save();
        this.updateUI();
        sound.coin();
        showToast(`🛒 "${name}" added to cart!`);
    }

    removeItem(name) {
        this.items = this.items.filter(i => i.name !== name);
        this.save();
        this.updateUI();
        sound.click();
    }

    increaseQty(name) {
        const item = this.items.find(i => i.name === name);
        if (item) {
            item.qty += 1;
            this.save();
            this.updateUI();
            sound.click();
        }
    }

    decreaseQty(name) {
        const item = this.items.find(i => i.name === name);
        if (item) {
            item.qty -= 1;
            if (item.qty <= 0) {
                this.removeItem(name);
                return;
            }
            this.save();
            this.updateUI();
            sound.click();
        }
    }

    getTotal() {
        return this.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    }

    getCount() {
        return this.items.reduce((sum, i) => sum + i.qty, 0);
    }

    save() {
        localStorage.setItem('luxbrick-cart', JSON.stringify(this.items));
    }

    updateUI() {
        const count = this.getCount();
        if (this.cartCount) {
            this.cartCount.textContent = count;
            if (count > 0) {
                this.cartCount.classList.add('bump');
                setTimeout(() => this.cartCount.classList.remove('bump'), 300);
            }
        }

        if (!this.cartItems || !this.cartFooter) return;

        if (count === 0) {
            this.cartItems.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-box-open"></i>
                    <p>Your cart is empty</p>
                    <span>Add some bricks to get started!</span>
                </div>
            `;
            this.cartFooter.style.display = 'none';
        } else {
            this.cartItems.innerHTML = this.items.map(item => `
                <div class="cart-item">
                    <span class="cart-item-icon">${item.icon}</span>
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-unit-price">৳${item.price.toLocaleString()} each</div>
                        <div class="cart-item-qty">
                            <button class="cart-qty-btn" data-action="decrease" data-name="${item.name}">−</button>
                            <span class="cart-qty-value">${item.qty}</span>
                            <button class="cart-qty-btn" data-action="increase" data-name="${item.name}">+</button>
                            <span class="cart-item-line-total">৳${(item.price * item.qty).toLocaleString()}</span>
                        </div>
                    </div>
                    <span class="cart-item-remove" data-name="${item.name}">&times;</span>
                </div>
            `).join('');

            this.cartFooter.style.display = 'block';
            this.cartTotal.textContent = '৳' + this.getTotal().toLocaleString();

            this.cartItems.querySelectorAll('.cart-item-remove').forEach(btn => {
                btn.addEventListener('click', () => this.removeItem(btn.dataset.name));
            });

            this.cartItems.querySelectorAll('.cart-qty-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    const name = btn.dataset.name;
                    if (action === 'increase') {
                        this.increaseQty(name);
                    } else {
                        this.decreaseQty(name);
                    }
                });
            });
        }
    }

    openCart() {
        if (this.cartModal) {
            this.cartModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            sound.click();
        }
    }

    closeCart() {
        if (this.cartModal) {
            this.cartModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    animateAddButton(btn) {
        if (!btn) return;
        btn.classList.remove('cart-added');
        void btn.offsetWidth;
        btn.classList.add('cart-added');
        setTimeout(() => btn.classList.remove('cart-added'), 500);
    }

    checkout() {
        if (this.getCount() === 0) return;
        sound.success();
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
        showToast('🏆 Order placed! Welcome to LUXBRICK family!');
        this.items = [];
        this.save();
        this.updateUI();
        setTimeout(() => this.closeCart(), 500);
    }
}

const cart = new Cart();

// ============================================
// 16. QUANTITY SELECTOR & DISCOUNT LOGIC
// ============================================
const BRICK_PRICE = 15;
const qtyInput = document.getElementById('qtyInput');
const qtyDecrease = document.getElementById('qtyDecrease');
const qtyIncrease = document.getElementById('qtyIncrease');

function getDiscount(qty) {
    if (qty >= 5000) return 2000;
    if (qty >= 1000) return 500;
    return 0;
}

function formatBdt(n) {
    return '৳' + n.toLocaleString();
}

function updateOrderSummary(qty) {
    const subtotal = qty * BRICK_PRICE;
    const discount = getDiscount(qty);
    const finalTotal = subtotal - discount;

    const bsSubtotal = document.getElementById('bsSubtotal');
    const bsDiscount = document.getElementById('bsDiscount');
    const bsFinal = document.getElementById('bsFinal');
    if (bsSubtotal) bsSubtotal.textContent = formatBdt(subtotal);
    if (bsDiscount) bsDiscount.textContent = discount > 0 ? '-৳' + discount.toLocaleString() : '৳0';
    if (bsFinal) bsFinal.textContent = formatBdt(finalTotal);

    // Update checkout modal if open
    const coQty = document.getElementById('coQty');
    const coSubtotal = document.getElementById('coSubtotal');
    const coDiscount = document.getElementById('coDiscount');
    const coFinal = document.getElementById('coFinal');
    if (coQty) coQty.textContent = qty.toLocaleString();
    if (coSubtotal) coSubtotal.textContent = formatBdt(subtotal);
    if (coDiscount) coDiscount.textContent = discount > 0 ? '-৳' + discount.toLocaleString() : '৳0';
    if (coFinal) coFinal.textContent = formatBdt(finalTotal);
}

function getQuantity() {
    return Math.max(1, parseInt(qtyInput ? qtyInput.value : 1000) || 1000);
}

function setQuantity(val) {
    if (!qtyInput) return;
    qtyInput.value = Math.max(1, val);
    updateOrderSummary(getQuantity());
}

if (qtyDecrease) {
    qtyDecrease.addEventListener('click', () => {
        setQuantity(getQuantity() - 1);
        if (typeof sound !== 'undefined') sound.click();
    });
}

if (qtyIncrease) {
    qtyIncrease.addEventListener('click', () => {
        setQuantity(getQuantity() + 1);
        if (typeof sound !== 'undefined') sound.click();
    });
}

// Initialize
updateOrderSummary(getQuantity());

// ============================================
// 17. CHECKOUT MODAL
// ============================================
const checkoutModal = document.getElementById('checkoutModal');
const checkoutClose = document.getElementById('checkoutClose');
const coConfirmBtn = document.getElementById('coConfirmBtn');
const coAddress = document.getElementById('coAddress');
const coPhone = document.getElementById('coPhone');
let selectedPayment = null;

// Open checkout from BUY NOW buttons
function openCheckout() {
    if (!checkoutModal) return;
    updateOrderSummary(getQuantity());
    selectedPayment = null;
    coConfirmBtn.disabled = true;
    if (coAddress) coAddress.value = '';
    if (coPhone) coPhone.value = '';
    document.querySelectorAll('.co-pay-card').forEach(c => c.classList.remove('selected'));
    checkoutModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (typeof sound !== 'undefined') sound.click();
}

function closeCheckout() {
    if (!checkoutModal) return;
    checkoutModal.style.display = 'none';
    document.body.style.overflow = '';
}

// BUY NOW buttons
const buyBtn = document.getElementById('buyBtn');
if (buyBtn) {
    buyBtn.addEventListener('click', function() {
        openCheckout();
    });
}

const showcaseCtaBtn = document.getElementById('showcaseCtaBtn');
if (showcaseCtaBtn) {
    showcaseCtaBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openCheckout();
    });
}

// Close checkout
if (checkoutClose) {
    checkoutClose.addEventListener('click', closeCheckout);
}

if (checkoutModal) {
    checkoutModal.addEventListener('click', function(e) {
        if (e.target === checkoutModal) closeCheckout();
    });
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeCheckout();
});

// Validate inputs
function validateCheckout() {
    const address = coAddress ? coAddress.value.trim() : '';
    const phone = coPhone ? coPhone.value.trim() : '';
    coConfirmBtn.disabled = !(address.length > 0 && phone.length > 0 && selectedPayment);
}

if (coAddress) {
    coAddress.addEventListener('input', validateCheckout);
}

if (coPhone) {
    coPhone.addEventListener('input', validateCheckout);
}

// Payment selection
document.querySelectorAll('.co-pay-card').forEach(card => {
    card.addEventListener('click', function() {
        document.querySelectorAll('.co-pay-card').forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
        selectedPayment = this.dataset.payment;
        validateCheckout();
        if (typeof sound !== 'undefined') sound.click();
    });
});

// Confirm order
if (coConfirmBtn) {
    coConfirmBtn.addEventListener('click', function() {
        if (this.disabled) return;

        // Play success sound
        if (typeof sound !== 'undefined') sound.success();

        // Confetti burst
        const duration = 3 * 1000;
        const end = Date.now() + duration;
        (function frame() {
            confetti({
                particleCount: 8,
                startVelocity: 40,
                spread: 360,
                origin: { y: 0.6 }
            });
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        })();

        // Multi burst
        setTimeout(() => {
            for (let i = 0; i < 6; i++) {
                setTimeout(() => {
                    confetti({
                        particleCount: 60,
                        spread: 100,
                        origin: { x: Math.random(), y: Math.random() * 0.5 },
                        colors: ['#FFD700', '#C0392B', '#F5F5F5', '#FF6B6B']
                    });
                }, i * 200);
            }
        }, 400);

        // Close checkout, show success modal
        setTimeout(() => {
            closeCheckout();
            const modal = document.getElementById('successModal');
            if (modal) modal.style.display = 'flex';
            if (typeof showToast !== 'undefined') {
                showToast('🎉 Order Confirmed! Thank you for choosing LUXBRICK™');
            }
        }, 800);
    });
}

// ===== CLOSE SUCCESS MODAL =====
function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ===== ESCAPE KEY TO CLOSE MODAL =====
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('successModal');
        if (modal && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    }
});

// ============================================
// MYSTERY BOX - সম্পূর্ণ ফাংশনাল
// ============================================
const mysteryBtn = document.getElementById('mysteryBtn');
const mysteryModal = document.getElementById('mysteryModal');
const mysteryClose = document.getElementById('mysteryClose');
const mysteryBox = document.getElementById('mysteryBox');
const mysteryRevealBtn = document.getElementById('mysteryRevealBtn');
const mysteryResult = document.getElementById('mysteryResult');
const mysteryPrizeIcon = document.getElementById('mysteryPrizeIcon');
const mysteryPrizeText = document.getElementById('mysteryPrizeText');

const mysteryPrizes = [
    { icon: '🎉', label: '50% OFF', color: '#FFD700' },
    { icon: '💎', label: '20% OFF', color: '#2ECC71' },
    { icon: '📦', label: 'Free Shipping', color: '#3498DB' },
    { icon: '👑', label: 'VIP Pass', color: '#9B59B6' },
    { icon: '🎁', label: 'Gift Box', color: '#E67E22' },
    { icon: '🏆', label: 'Premium Badge', color: '#C0392B' },
    { icon: '✨', label: '15% OFF', color: '#1ABC9C' },
    { icon: '🌟', label: '10% OFF', color: '#F39C12' }
];

let isRevealed = false;
let hasClaimed = localStorage.getItem('luxbrick-mystery') === 'done';

// Open Modal
if (mysteryBtn) {
    mysteryBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (mysteryModal) {
            mysteryModal.style.display = 'flex';
            sound.click();
            
            // Reset state
            isRevealed = false;
            mysteryBox.classList.remove('flipped');
            mysteryRevealBtn.disabled = hasClaimed;
            mysteryRevealBtn.textContent = hasClaimed ? '✓ Claimed' : '🔮 Reveal Prize';
            mysteryResult.textContent = '';
            
            if (hasClaimed) {
                mysteryRevealBtn.classList.add('claimed');
            } else {
                mysteryRevealBtn.classList.remove('claimed');
            }
        }
    });
}

// Close Modal
if (mysteryClose) {
    mysteryClose.addEventListener('click', function() {
        if (mysteryModal) mysteryModal.style.display = 'none';
    });
}

if (mysteryModal) {
    mysteryModal.addEventListener('click', function(e) {
        if (e.target === mysteryModal) {
            mysteryModal.style.display = 'none';
        }
    });
}

// Click on box to flip
if (mysteryBox) {
    mysteryBox.addEventListener('click', function() {
        if (isRevealed || hasClaimed) return;
        revealPrize();
    });
}

// Reveal Button
if (mysteryRevealBtn) {
    mysteryRevealBtn.addEventListener('click', function() {
        if (isRevealed || hasClaimed) return;
        revealPrize();
    });
}

function revealPrize() {
    if (isRevealed || hasClaimed) return;
    
    isRevealed = true;
    mysteryRevealBtn.disabled = true;
    mysteryRevealBtn.textContent = '⏳ Revealing...';
    sound.click();
    
    // Random prize
    const prizeIndex = Math.floor(Math.random() * mysteryPrizes.length);
    const prize = mysteryPrizes[prizeIndex];
    
    // Set prize content
    mysteryPrizeIcon.textContent = prize.icon;
    mysteryPrizeText.textContent = prize.label;
    mysteryPrizeText.style.color = prize.color;
    
    // Flip box after short delay
    setTimeout(() => {
        mysteryBox.classList.add('flipped');
        sound.coin();
        
        // Show result
        mysteryResult.innerHTML = `🎊 You won: ${prize.icon} ${prize.label}!`;
        mysteryResult.style.color = '#FFD700';
        
        // Confetti
        confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
        });
        
        showToast(`🎊 You won: ${prize.icon} ${prize.label}!`);
        
        // Mark as claimed
        hasClaimed = true;
        localStorage.setItem('luxbrick-mystery', 'done');
        
        mysteryRevealBtn.disabled = true;
        mysteryRevealBtn.textContent = '✓ Claimed';
        mysteryRevealBtn.classList.add('claimed');
        
    }, 600);
}

// Reset for testing
function resetMystery() {
    localStorage.removeItem('luxbrick-mystery');
    hasClaimed = false;
    isRevealed = false;
    mysteryBox.classList.remove('flipped');
    mysteryRevealBtn.disabled = false;
    mysteryRevealBtn.textContent = '🔮 Reveal Prize';
    mysteryRevealBtn.classList.remove('claimed');
    mysteryResult.textContent = '';
}

console.log('🎁 Mystery Box loaded successfully!');
  

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
// 19. SCROLL ANIMATIONS - ফিক্সড
// ============================================
// Features - ফোর্স ভিজিবিলিটি
document.querySelectorAll('.feature-card').forEach((card, i) => {
    // ভিজিবল করে দিন
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
    
    gsap.from(card, {
        scrollTrigger: {
            trigger: card,
            start: 'top 95%',
            toggleActions: 'play none none none'
        },
        duration: 0.8,
        y: 50,
        opacity: 0,
        delay: i * 0.1,
        ease: 'power3.out'
    });
});

// Testimonials - ফোর্স ভিজিবিলিটি
document.querySelectorAll('.testimonial-card').forEach((card, i) => {
    // ভিজিবল করে দিন
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
    
    gsap.from(card, {
        scrollTrigger: {
            trigger: card,
            start: 'top 95%',
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
// 20. BRICK SCROLL REVEAL - Story (Three.js State)
// ============================================
const storyBrick = document.querySelector('.story-brick');
if (storyBrick) {
    gsap.fromTo(storyBrick,
        { opacity: 0.3 },
        {
            scrollTrigger: {
                trigger: '.story-visual',
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            duration: 1.8,
            opacity: 1,
            ease: 'power3.out'
        }
    );
    gsap.fromTo(window.threeBricks.story,
        { rotationY: -30 },
        {
            scrollTrigger: {
                trigger: '.story-visual',
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            duration: 1.8,
            rotationY: 0,
            ease: 'power3.out'
        }
    );
}

// ============================================
// 21. BRICK SCROLL REVEAL - Premium (Three.js State)
// ============================================
const premiumBrick = document.querySelector('.premium-brick-3d');
if (premiumBrick) {
    gsap.fromTo(premiumBrick,
        { opacity: 0 },
        {
            scrollTrigger: {
                trigger: '.buy-visual',
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            duration: 1.6,
            opacity: 1,
            ease: 'power3.out'
        }
    );
    gsap.fromTo(window.threeBricks.premium,
        { rotationY: 40, scale: 0.7 },
        {
            scrollTrigger: {
                trigger: '.buy-visual',
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            duration: 1.6,
            rotationY: 30,
            scale: 1,
            ease: 'power3.out'
        }
    );
}

// ============================================
// 22. KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'g' || e.key === 'G') {
        if (themeToggle) themeToggle.click();
    }
    if (e.key === 'r' || e.key === 'R') {
        if (document.getElementById('gameCatch') && document.getElementById('gameCatch').classList.contains('active')) {
            game.resetGame();
        }
    }
});

// ============================================
// 23. CINEMATIC LOADER ANIMATION
// ============================================
(function initLoaderAnimation() {
    const loader = document.getElementById('loader');
    const container = document.getElementById('loaderBrickContainer');
    const brand = document.getElementById('loaderBrand');
    if (!loader || !container) return;

    // Mansion silhouette grid (12 cols x 10 rows)
    // 0 = empty, 1 = wall brick, 2 = gold accent
    const mansion = [
        [0,0,0,0,1,1,1,0,0,0,0,0],
        [0,0,0,0,1,0,1,0,0,0,0,0],
        [0,0,0,1,1,1,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,0,0,0],
        [0,0,1,2,1,1,1,1,2,1,0,0],
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,1,0,1,1,1,1,0,1,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,1,1,1,1,1,1,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1],
    ];

    const rows = mansion.length;
    const cols = mansion[0].length;
    const brickW = 38;
    const brickH = 24;
    const gap = 2;
    const totalW = cols * (brickW + gap);
    const totalH = rows * (brickH + gap);
    const offsetX = -totalW / 2 + brickW / 2;
    const offsetY = -totalH / 2 + brickH / 2;

    const bricks = [];
    const goldBricks = [];

    mansion.forEach((row, r) => {
        row.forEach((val, c) => {
            if (val === 0) return;
            const el = document.createElement('div');
            el.className = 'loader-brick' + (val === 2 ? ' accent' : '');
            el.style.width = brickW + 'px';
            el.style.height = brickH + 'px';
            container.appendChild(el);
            const targetX = c * (brickW + gap) + offsetX + brickW / 2;
            const targetY = r * (brickH + gap) + offsetY + brickH / 2;
            bricks.push({ el, targetX, targetY, isGold: val === 2 });
            if (val === 2) goldBricks.push(el);
        });
    });

    // Scatter all bricks to random positions off-screen
    bricks.forEach((b) => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 350 + Math.random() * 450;
        gsap.set(b.el, {
            x: b.targetX + Math.cos(angle) * dist,
            y: b.targetY + Math.sin(angle) * dist,
            rotationX: (Math.random() - 0.5) * 200,
            rotationY: (Math.random() - 0.5) * 200,
            rotationZ: (Math.random() - 0.5) * 200,
            opacity: 0,
            scale: 0.3 + Math.random() * 0.5
        });
    });

    const allBrickEls = bricks.map(b => b.el);

    // Build the cinematic timeline
    const tl = gsap.timeline({
        paused: true,
        onComplete: () => {
            loader.classList.add('hide');
            setTimeout(() => {
                loader.style.display = 'none';
                AOS.refresh();
            }, 800);
        }
    });

    // Phase 1: Bricks fly in from all directions with stagger
    tl.to(allBrickEls, {
        x: (i) => bricks[i].targetX,
        y: (i) => bricks[i].targetY,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        opacity: 1,
        scale: 1,
        duration: 0.9,
        stagger: { each: 0.02, from: 'random' },
        ease: 'power3.out'
    }, 0.15);

    // Phase 2: Gold accents pulse
    tl.to(goldBricks, {
        boxShadow: '0 0 24px rgba(255,215,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
        borderColor: 'rgba(255,215,0,0.6)',
        duration: 0.5,
        ease: 'power2.out'
    }, '+=0.3');

    // Phase 3: Golden shimmer sweep
    tl.fromTo(allBrickEls, {
        filter: 'brightness(1) saturate(1)'
    }, {
        filter: 'brightness(1.35) saturate(1.2)',
        duration: 0.7,
        ease: 'power2.inOut',
        yoyo: true,
        repeat: 1
    }, '+=0.2');

    // Phase 4: Brand text fades in with golden glow
    tl.to(brand, {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out'
    }, '+=0.3');

    // Phase 5: Bricks gently dissolve outward
    tl.to(allBrickEls, {
        opacity: 0,
        scale: 0.7,
        duration: 0.55,
        stagger: { each: 0.012, from: 'edges' },
        ease: 'power2.in'
    }, '+=1.0');

    // Final hold
    tl.to({}, { duration: 0.3 });

    // Start the animation after window load
    window.addEventListener('load', () => {
        setTimeout(() => tl.play(), 200);
    });
})();

// ============================================
// 24. SHOWCASE CARD FADE-IN
// ============================================
const showcaseCard = document.querySelector('.showcase-card');
if (showcaseCard) {
    gsap.fromTo(showcaseCard,
        { opacity: 0, y: 40 },
        {
            scrollTrigger: {
                trigger: '.showcase-visual',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            duration: 1.2,
            opacity: 1,
            y: 0,
            ease: 'power3.out'
        }
    );
}

// Spec rows stagger
document.querySelectorAll('.ss-row').forEach((row, i) => {
    gsap.from(row, {
        scrollTrigger: {
            trigger: row,
            start: 'top 95%',
            toggleActions: 'play none none none'
        },
        duration: 0.4,
        x: -15,
        opacity: 0,
        delay: i * 0.05,
        ease: 'power3.out'
    });
});

// Trust badges stagger
document.querySelectorAll('.st-badge').forEach((badge, i) => {
    gsap.from(badge, {
        scrollTrigger: {
            trigger: badge,
            start: 'top 95%',
            toggleActions: 'play none none none'
        },
        duration: 0.4,
        y: 10,
        opacity: 0,
        delay: i * 0.08,
        ease: 'power3.out'
    });
});

// Payment cards stagger
document.querySelectorAll('.payment-card').forEach((card, i) => {
    gsap.from(card, {
        scrollTrigger: {
            trigger: '.payment-cards',
            start: 'top 95%',
            toggleActions: 'play none none none'
        },
        duration: 0.3,
        scale: 0.9,
        opacity: 0,
        delay: i * 0.06,
        ease: 'back.out(1.7)'
    });
});

// ============================================
// 25. SHOWCASE WISHLIST
// ============================================
const showcaseWishlistBtn = document.getElementById('showcaseWishlistBtn');
if (showcaseWishlistBtn) {
    showcaseWishlistBtn.addEventListener('click', () => {
        showcaseWishlistBtn.classList.toggle('liked');
        if (typeof sound !== 'undefined') sound.click();
        if (typeof showToast !== 'undefined') {
            if (showcaseWishlistBtn.classList.contains('liked')) {
                showToast('❤️ Added to Wishlist');
            } else {
                showToast('Removed from Wishlist');
            }
        }
    });
}

console.log('🧱 LUXBRICK™ - The Brick That Built Legends');
console.log('✦ Features: 360° Viewer, Live Counter, Theme Toggle (G), 3 Games');
console.log('✦ Keyboard: G = Theme Toggle, R = Reset Game');
console.log('✦ Checkout: Bulk pricing with qty/discount modal flow');
console.log('✦ Built for Grameenphone Academy - Top 80!');