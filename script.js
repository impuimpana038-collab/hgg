/**
 * Tik Talk - Tic-Tac-Toe Master Game Logic
 * Features:
 * - 2-Player Local & AI Modes
 * - 3 AI Difficulties (Easy, Medium, Unbeatable Minimax)
 * - Synthesized Web Audio API sound effects (100% offline)
 * - Confetti celebration particle engine
 * - SVG winning line animation & scoreboard persistence
 */

// ==========================================
// 1. Audio Engine (Web Audio API)
// ==========================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playMove(symbol) {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = symbol === 'X' ? 'triangle' : 'sine';
      const freq = symbol === 'X' ? 520 : 420;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  playWin() {
    if (this.muted || !this.ctx) return;
    try {
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.26);
      });
    } catch (e) {
      console.warn('Audio win error', e);
    }
  }

  playTie() {
    if (this.muted || !this.ctx) return;
    try {
      const notes = [400, 350, 300];
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.19);
      });
    } catch (e) {
      console.warn('Audio tie error', e);
    }
  }

  playClick() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      console.warn('Audio click error', e);
    }
  }
}

// ==========================================
// 2. Confetti Particle Engine
// ==========================================
class ConfettiEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  fire(duration = 2000) {
    this.resize();
    this.particles = [];
    const colors = ['#00f2fe', '#4facfe', '#ff2a6d', '#ff758c', '#ffb86c', '#f1fa8c', '#50fa7b'];
    const count = 90;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 80,
        y: this.canvas.height * 0.45,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.8) * 18,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 14,
        gravity: 0.4,
        drag: 0.98,
        opacity: 1
      });
    }

    if (this.animationId) cancelAnimationFrame(this.animationId);
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.particles.forEach((p) => {
        p.vx *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (elapsed > duration - 600) {
          p.opacity = Math.max(0, 1 - (elapsed - (duration - 600)) / 600);
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.opacity;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        this.ctx.restore();
      });

      if (elapsed < duration) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.animationId = null;
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }
}

// ==========================================
// 3. Minimax AI & Strategy Engine
// ==========================================
const WINNING_COMBOS = [
  [0, 1, 2], // Row 1
  [3, 4, 5], // Row 2
  [6, 7, 8], // Row 3
  [0, 3, 6], // Col 1
  [1, 4, 7], // Col 2
  [2, 5, 8], // Col 3
  [0, 4, 8], // Diag 1
  [2, 4, 6]  // Diag 2
];

function checkWinnerOnBoard(board) {
  for (let combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combo };
    }
  }
  if (board.every(cell => cell !== null)) {
    return { winner: 'tie', combo: null };
  }
  return null;
}

function getAvailableMoves(board) {
  const moves = [];
  board.forEach((val, idx) => {
    if (val === null) moves.push(idx);
  });
  return moves;
}

// Minimax algorithm with depth scoring
function minimax(board, depth, isMaximizing, aiSymbol, humanSymbol) {
  const result = checkWinnerOnBoard(board);
  if (result) {
    if (result.winner === aiSymbol) return 10 - depth;
    if (result.winner === humanSymbol) return depth - 10;
    if (result.winner === 'tie') return 0;
  }

  const available = getAvailableMoves(board);

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let idx of available) {
      board[idx] = aiSymbol;
      const score = minimax(board, depth + 1, false, aiSymbol, humanSymbol);
      board[idx] = null;
      bestScore = Math.max(score, bestScore);
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let idx of available) {
      board[idx] = humanSymbol;
      const score = minimax(board, depth + 1, true, aiSymbol, humanSymbol);
      board[idx] = null;
      bestScore = Math.min(score, bestScore);
    }
    return bestScore;
  }
}

function getBestMove(board, aiSymbol, humanSymbol) {
  let bestScore = -Infinity;
  let bestMove = null;
  const available = getAvailableMoves(board);

  // If opening move and center is empty, high chance center is best
  if (available.length === 9) return 4;

  for (let idx of available) {
    board[idx] = aiSymbol;
    const score = minimax(board, 0, false, aiSymbol, humanSymbol);
    board[idx] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }
  return bestMove !== null ? bestMove : available[0];
}

function getMediumMove(board, aiSymbol, humanSymbol) {
  const available = getAvailableMoves(board);

  // 1. Can AI win right now?
  for (let idx of available) {
    board[idx] = aiSymbol;
    if (checkWinnerOnBoard(board)?.winner === aiSymbol) {
      board[idx] = null;
      return idx;
    }
    board[idx] = null;
  }

  // 2. Can Human win right now? Block them!
  for (let idx of available) {
    board[idx] = humanSymbol;
    if (checkWinnerOnBoard(board)?.winner === humanSymbol) {
      board[idx] = null;
      return idx;
    }
    board[idx] = null;
  }

  // 3. Take center if free (60% chance)
  if (board[4] === null && Math.random() < 0.6) {
    return 4;
  }

  // 4. Otherwise pick random move
  return available[Math.floor(Math.random() * available.length)];
}

function getEasyMove(board) {
  const available = getAvailableMoves(board);
  return available[Math.floor(Math.random() * available.length)];
}

// ==========================================
// 4. Game Controller & UI Integration
// ==========================================
class TicTacToeGame {
  constructor() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.gameMode = 'pve'; // 'pve' or 'pvp'
    this.difficulty = 'hard'; // 'easy', 'medium', 'hard'
    this.isGameActive = true;
    this.aiSymbol = 'O';
    this.humanSymbol = 'X';
    this.isAiThinking = false;

    this.scores = this.loadScores();

    this.sound = new SoundEngine();
    this.confetti = new ConfettiEngine(document.getElementById('confetti-canvas'));

    this.cacheDom();
    this.bindEvents();
    this.updateScoreboardUI();
    this.updateTurnUI();
  }

  loadScores() {
    const saved = localStorage.getItem('tik_talk_scores');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return { x: 0, o: 0, ties: 0 };
  }

  saveScores() {
    localStorage.setItem('tik_talk_scores', JSON.stringify(this.scores));
  }

  cacheDom() {
    this.cells = document.querySelectorAll('.cell');
    this.boardEl = document.getElementById('board');
    this.statusText = document.getElementById('status-text');
    this.turnDot = document.getElementById('turn-dot');
    this.scoreXEl = document.getElementById('score-x');
    this.scoreOEl = document.getElementById('score-o');
    this.scoreTiesEl = document.getElementById('score-ties');
    this.nameXEl = document.getElementById('name-x');
    this.nameOEl = document.getElementById('name-o');
    this.restartBtn = document.getElementById('restart-btn');
    this.resetScoresBtn = document.getElementById('reset-scores-btn');
    this.modeButtons = document.querySelectorAll('.segment-btn');
    this.diffButtons = document.querySelectorAll('.diff-btn');
    this.diffGroup = document.getElementById('difficulty-group');
    this.soundToggleBtn = document.getElementById('sound-toggle-btn');
    this.soundIcon = document.getElementById('sound-icon');
    this.winningSvg = document.getElementById('winning-line-svg');
    this.winningLine = document.getElementById('winning-line');
  }

  bindEvents() {
    // Cell clicks
    this.cells.forEach(cell => {
      cell.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        this.handleCellClick(index);
      });
    });

    // Action buttons
    this.restartBtn.addEventListener('click', () => {
      this.sound.playClick();
      this.resetRound();
    });

    this.resetScoresBtn.addEventListener('click', () => {
      this.sound.playClick();
      this.resetScores();
    });

    // Sound toggle
    this.soundToggleBtn.addEventListener('click', () => {
      this.sound.init();
      this.sound.muted = !this.sound.muted;
      this.soundIcon.textContent = this.sound.muted ? '🔇' : '🔊';
    });

    // Mode switch
    this.modeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.sound.init();
        this.sound.playClick();
        const mode = e.currentTarget.getAttribute('data-mode');
        if (mode === this.gameMode) return;

        this.modeButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.gameMode = mode;

        if (mode === 'pvp') {
          this.diffGroup.style.display = 'none';
          this.nameXEl.textContent = 'Player 1';
          this.nameOEl.textContent = 'Player 2';
        } else {
          this.diffGroup.style.display = 'flex';
          this.nameXEl.textContent = 'Player';
          this.nameOEl.textContent = 'AI Bot';
        }

        this.resetRound();
      });
    });

    // Difficulty switch
    this.diffButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.sound.init();
        this.sound.playClick();
        this.diffButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.difficulty = e.currentTarget.getAttribute('data-diff');
        this.resetRound();
      });
    });
  }

  handleCellClick(index) {
    this.sound.init();

    // Guard conditions
    if (!this.isGameActive || this.board[index] !== null || this.isAiThinking) {
      return;
    }

    // Execute Human Move
    this.makeMove(index, this.currentPlayer);

    const result = checkWinnerOnBoard(this.board);
    if (result) {
      this.handleGameOver(result);
      return;
    }

    // Switch turn
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    this.updateTurnUI();

    // Handle AI turn if PVE
    if (this.gameMode === 'pve' && this.currentPlayer === this.aiSymbol) {
      this.handleAiTurn();
    }
  }

  makeMove(index, symbol) {
    this.board[index] = symbol;
    const cell = this.cells[index];
    cell.textContent = symbol;
    cell.classList.add(symbol.toLowerCase(), 'taken');
    this.sound.playMove(symbol);
  }

  handleAiTurn() {
    this.isAiThinking = true;
    this.statusText.textContent = 'AI is thinking...';
    this.turnDot.style.background = 'var(--color-o)';
    this.turnDot.style.boxShadow = '0 0 10px var(--color-o)';

    const thinkTime = 320 + Math.random() * 200;

    setTimeout(() => {
      if (!this.isGameActive) {
        this.isAiThinking = false;
        return;
      }

      let move;
      if (this.difficulty === 'easy') {
        move = getEasyMove(this.board);
      } else if (this.difficulty === 'medium') {
        move = getMediumMove(this.board, this.aiSymbol, this.humanSymbol);
      } else {
        move = getBestMove(this.board, this.aiSymbol, this.humanSymbol);
      }

      if (move !== null && move !== undefined) {
        this.makeMove(move, this.aiSymbol);
        const result = checkWinnerOnBoard(this.board);
        if (result) {
          this.handleGameOver(result);
        } else {
          this.currentPlayer = this.humanSymbol;
          this.updateTurnUI();
        }
      }

      this.isAiThinking = false;
    }, thinkTime);
  }

  handleGameOver(result) {
    this.isGameActive = false;
    this.isAiThinking = false;

    if (result.winner === 'tie') {
      this.scores.ties++;
      this.statusText.textContent = "It's a draw!";
      this.turnDot.style.background = 'var(--color-tie)';
      this.turnDot.style.boxShadow = '0 0 10px var(--color-tie)';
      this.sound.playTie();
    } else {
      const winner = result.winner;
      if (winner === 'X') {
        this.scores.x++;
      } else {
        this.scores.o++;
      }

      let winnerName = winner;
      if (this.gameMode === 'pve') {
        winnerName = winner === 'X' ? 'You won! 🎉' : 'AI Bot wins!';
      } else {
        winnerName = winner === 'X' ? 'Player 1 wins! 🎉' : 'Player 2 wins! 🎉';
      }
      this.statusText.textContent = winnerName;

      // Highlight winning cells
      result.combo.forEach(idx => {
        this.cells[idx].classList.add('winner');
      });

      // Draw winning line
      this.drawWinningLine(result.combo, winner);

      // Sound & Confetti celebration
      this.sound.playWin();
      if (this.gameMode === 'pvp' || winner === 'X') {
        this.confetti.fire(2400);
      }
    }

    this.saveScores();
    this.updateScoreboardUI();
  }

  drawWinningLine(combo, winner) {
    const lineCoordMap = {
      '0,1,2': { x1: 20, y1: 50, x2: 280, y2: 50 },      // Row 1
      '3,4,5': { x1: 20, y1: 150, x2: 280, y2: 150 },    // Row 2
      '6,7,8': { x1: 20, y1: 250, x2: 280, y2: 250 },    // Row 3
      '0,3,6': { x1: 50, y1: 20, x2: 50, y2: 280 },      // Col 1
      '1,4,7': { x1: 150, y1: 20, x2: 150, y2: 280 },    // Col 2
      '2,5,8': { x1: 250, y1: 20, x2: 250, y2: 280 },    // Col 3
      '0,4,8': { x1: 30, y1: 30, x2: 270, y2: 270 },     // Diag 1
      '2,4,6': { x1: 270, y1: 30, x2: 30, y2: 270 }      // Diag 2
    };

    const key = combo.join(',');
    const coords = lineCoordMap[key];
    if (coords) {
      const strokeColor = winner === 'X' ? '#00f2fe' : '#ff2a6d';
      this.winningLine.setAttribute('x1', coords.x1);
      this.winningLine.setAttribute('y1', coords.y1);
      this.winningLine.setAttribute('x2', coords.x2);
      this.winningLine.setAttribute('y2', coords.y2);
      this.winningLine.style.stroke = strokeColor;
      this.winningLine.style.filter = `drop-shadow(0 0 12px ${strokeColor})`;

      this.winningSvg.style.display = 'block';
      // Trigger CSS dash offset animation
      requestAnimationFrame(() => {
        this.winningLine.style.strokeDashoffset = '0';
      });
    }
  }

  resetRound() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.isGameActive = true;
    this.isAiThinking = false;

    // Reset UI
    this.cells.forEach(cell => {
      cell.textContent = '';
      cell.className = 'cell';
    });

    // Reset winning line
    this.winningSvg.style.display = 'none';
    this.winningLine.style.strokeDashoffset = '400';

    this.updateTurnUI();
  }

  resetScores() {
    this.scores = { x: 0, o: 0, ties: 0 };
    this.saveScores();
    this.updateScoreboardUI();
    this.resetRound();
  }

  updateScoreboardUI() {
    this.scoreXEl.textContent = this.scores.x;
    this.scoreOEl.textContent = this.scores.o;
    this.scoreTiesEl.textContent = this.scores.ties;
  }

  updateTurnUI() {
    const isX = this.currentPlayer === 'X';
    let text = '';

    if (this.gameMode === 'pve') {
      text = isX ? 'Your turn (X)' : 'AI turn (O)';
    } else {
      text = isX ? "Player 1's turn (X)" : "Player 2's turn (O)";
    }

    this.statusText.textContent = text;
    this.turnDot.style.background = isX ? 'var(--color-x)' : 'var(--color-o)';
    this.turnDot.style.boxShadow = isX
      ? '0 0 10px var(--color-x)'
      : '0 0 10px var(--color-o)';
  }
}

// Instantiate game on window load
document.addEventListener('DOMContentLoaded', () => {
  window.game = new TicTacToeGame();
});