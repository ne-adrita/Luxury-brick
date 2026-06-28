// ============================================
// GAME TABS SWITCHING
// ============================================
document.querySelectorAll('.game-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        // Remove active from all tabs and panels
        document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.game-panel').forEach(p => p.classList.remove('active'));
        
        // Add active to clicked tab
        this.classList.add('active');
        
        // Show corresponding panel
        const gameId = this.dataset.game;
        document.getElementById('game' + gameId.charAt(0).toUpperCase() + gameId.slice(1)).classList.add('active');
        
        // Reset game states if needed
        sound.click();
    });
});

// ============================================
// MEMORY MATCH GAME
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
        
        // Create card pairs
        const pairs = [...this.icons, ...this.icons];
        // Shuffle
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
        
        // Flip card
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
            // Match!
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.matchedPairs++;
            this.matchesDisplay.textContent = this.matchedPairs;
            sound.coin();
            
            this.flippedCards = [];
            this.isLocked = false;
            
            // Check win
            if (this.matchedPairs === this.icons.length) {
                this.winGame();
            }
        } else {
            // No match
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
                ${this.moves === this.bestScore ? '🏆 New Best Score!' : `Best: ${this.bestScore} moves`}
            </p>
            <button class="game-btn" onclick="memoryGame.initGame()" style="margin-top: 1rem;">
                Play Again
            </button>
        `;
        
        sound.success();
        // Celebration
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

const memoryGame = new MemoryGame();

// ============================================
// REACTION TEST GAME
// ============================================
class ReactionTest {
    constructor() {
        this.state = 'idle'; // idle, waiting, ready, go, result
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
        
        // Random delay 2-5 seconds
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
        if (this.state === 'idle') {
            // Show instruction
            return;
        }
        
        if (this.state === 'waiting') {
            // Clicked too early
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
            // Success!
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
            
            // Confetti for excellent
            if (isExcellent) {
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.6 }
                });
            }
            return;
        }
    }
}

const reactionTest = new ReactionTest();