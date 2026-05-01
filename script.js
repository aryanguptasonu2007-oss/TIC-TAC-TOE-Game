// ===== GAME STATE =====
let board = Array(9).fill('');
let currentPlayer = 'X';
let gameMode = 'ai';
let difficulty = 'medium';
let gameActive = true;
let scores = { X: 0, O: 0, draws: 0 };

const WIN_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  spawnParticles();
  updateUI();
});

// ===== PARTICLES =====
function spawnParticles() {
  const container = document.getElementById('particles');
  const colors = ['#FF2D55','#00F5FF','#BF5AF2','#FFD60A','#FF9500'];
  for (let i = 0; i < 30; i++) {
    setTimeout(() => createParticle(container, colors), i * 400);
  }
}

function createParticle(container, colors) {
  const el = document.createElement('div');
  el.className = 'particle';
  const size = Math.random() * 6 + 3;
  const color = colors[Math.floor(Math.random() * colors.length)];
  const left = Math.random() * 100;
  const duration = Math.random() * 12 + 8;
  const delay = Math.random() * 5;
  el.style.cssText = `
    width:${size}px; height:${size}px;
    background:${color};
    left:${left}%;
    bottom: -20px;
    animation-duration:${duration}s;
    animation-delay:${delay}s;
    box-shadow: 0 0 ${size*2}px ${color};
  `;
  container.appendChild(el);
  el.addEventListener('animationend', () => {
    el.remove();
    createParticle(container, colors);
  });
}

// ===== MODE & DIFFICULTY =====
function selectMode(mode) {
  gameMode = mode;
  document.getElementById('pvpCard').classList.toggle('active', mode === 'pvp');
  document.getElementById('aiCard').classList.toggle('active', mode === 'ai');
  document.getElementById('difficultyRow').style.display = mode === 'ai' ? 'flex' : 'none';
  document.getElementById('nameO').textContent = mode === 'ai' ? 'AI' : 'Player O';
  resetGame();
}

function selectDiff(diff) {
  difficulty = diff;
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('d' + diff.charAt(0).toUpperCase() + diff.slice(1)).classList.add('active');
  resetGame();
}

// ===== CLICK HANDLER =====
function handleClick(index) {
  if (!gameActive || board[index] !== '') return;
  if (gameMode === 'ai' && currentPlayer === 'O') return;
  makeMove(index, currentPlayer);
}

function makeMove(index, player) {
  board[index] = player;
  const cell = document.querySelector(`[data-index="${index}"]`);
  cell.textContent = player;
  cell.classList.add(player.toLowerCase(), 'taken');

  const result = checkWin();
  if (result) {
    endGame(result);
    return;
  }
  if (board.every(c => c !== '')) {
    endGame('draw');
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  updateTurnIndicator();

  if (gameMode === 'ai' && currentPlayer === 'O') {
    setThinking(true);
    setTimeout(() => {
      const move = getAIMove();
      setThinking(false);
      makeMove(move, 'O');
    }, 500);
  }
}

// ===== WIN CHECK =====
function checkWin() {
  for (const [a, b, c] of WIN_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combo: [a, b, c] };
    }
  }
  return null;
}

// ===== END GAME =====
function endGame(result) {
  gameActive = false;
  if (result === 'draw') {
    scores.draws++;
    showOverlay('🤝', 'DRAW!', "It's a tie — no one wins", false);
    document.getElementById('statusText').textContent = "It's a draw!";
    document.getElementById('scoreDraw').textContent = `${scores.draws} Draw${scores.draws !== 1 ? 's' : ''}`;
  } else {
    const { winner, combo } = result;
    scores[winner]++;
    highlightWinners(combo, winner);
    drawWinLine(combo);
    const name = winner === 'X' ? 'Player X' : (gameMode === 'ai' ? 'AI' : 'Player O');
    showOverlay(
      winner === 'X' ? '🏆' : '🤖',
      'WINNER!',
      `${name} dominates the board`,
      true
    );
    document.getElementById('statusText').textContent = `${name} wins!`;
    document.getElementById(`num${winner}`).textContent = scores[winner];
  }
  updateTurnIndicator(true);
}

function highlightWinners(combo, player) {
  combo.forEach(i => {
    const cell = document.querySelector(`[data-index="${i}"]`);
    cell.classList.add('winner', player.toLowerCase());
  });
}

// ===== WIN LINE (SVG) =====
const linePositions = {
  '012': [[0.17,0.17],[2.83,0.17]],
  '345': [[0.17,1.00],[2.83,1.00]],
  '678': [[0.17,1.83],[2.83,1.83]],
  '036': [[0.17,0.17],[0.17,2.83]],
  '147': [[1.00,0.17],[1.00,2.83]],
  '258': [[1.83,0.17],[1.83,2.83]],
  '048': [[0.17,0.17],[2.83,2.83]],
  '246': [[2.83,0.17],[0.17,2.83]],
};

function drawWinLine(combo) {
  const key = combo.join('');
  const pos = linePositions[key];
  if (!pos) return;
  const line = document.getElementById('winLineEl');
  line.setAttribute('x1', pos[0][0]);
  line.setAttribute('y1', pos[0][1]);
  line.setAttribute('x2', pos[1][0]);
  line.setAttribute('y2', pos[1][1]);
  line.style.stroke = combo.some(i => board[i] === 'X') ? '#FF2D55' : '#00F5FF';
  line.style.strokeDasharray = '6';
  line.style.strokeDashoffset = '6';
  requestAnimationFrame(() => requestAnimationFrame(() => line.classList.add('draw')));
}

// ===== OVERLAY =====
function showOverlay(emoji, title, sub, withConfetti) {
  document.getElementById('winEmoji').textContent = emoji;
  document.getElementById('winTitle').textContent = title;
  document.getElementById('winSub').textContent = sub;
  document.getElementById('winOverlay').classList.add('show');
  if (withConfetti) spawnConfetti();
}

// ===== CONFETTI =====
function spawnConfetti() {
  const container = document.getElementById('confettiContainer');
  container.innerHTML = '';
  const colors = ['#FF2D55','#00F5FF','#FFD60A','#BF5AF2','#FF9500','#34C759'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 1.5;
    const duration = Math.random() * 2 + 1.5;
    const size = Math.random() * 8 + 4;
    el.style.cssText = `
      left:${left}%; top:0;
      background:${color};
      width:${size}px; height:${size}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation-delay:${delay}s;
      animation-duration:${duration}s;
    `;
    container.appendChild(el);
  }
}

// ===== STATUS & TURN =====
function updateTurnIndicator(gameOver = false) {
  const xCard = document.getElementById('scoreX');
  const oCard = document.getElementById('scoreO');
  xCard.classList.toggle('active-turn', currentPlayer === 'X' && !gameOver);
  oCard.classList.toggle('active-turn', currentPlayer === 'O' && !gameOver);
  if (!gameOver) {
    const name = currentPlayer === 'X' ? 'Player X' : (gameMode === 'ai' ? 'AI' : 'Player O');
    document.getElementById('statusText').textContent = `${name}'s turn`;
  }
}

function setThinking(isThinking) {
  document.getElementById('statusBar').classList.toggle('thinking', isThinking);
  if (isThinking) document.getElementById('statusText').textContent = 'AI is thinking...';
}

// ===== RESET =====
function resetGame() {
  board = Array(9).fill('');
  currentPlayer = 'X';
  gameActive = true;
  document.querySelectorAll('.cell').forEach(c => {
    c.textContent = '';
    c.className = 'cell';
  });
  const line = document.getElementById('winLineEl');
  line.classList.remove('draw');
  line.setAttribute('x1', 0); line.setAttribute('y1', 0);
  line.setAttribute('x2', 0); line.setAttribute('y2', 0);
  document.getElementById('winOverlay').classList.remove('show');
  document.getElementById('statusText').textContent = "Player X's turn";
  updateTurnIndicator();
}

function clearScores() {
  scores = { X: 0, O: 0, draws: 0 };
  document.getElementById('numX').textContent = '0';
  document.getElementById('numO').textContent = '0';
  document.getElementById('scoreDraw').textContent = '0 Draws';
  resetGame();
}

function updateUI() {
  document.getElementById('difficultyRow').style.display = gameMode === 'ai' ? 'flex' : 'none';
  updateTurnIndicator();
}

// ===== AI ENGINE =====
function getAIMove() {
  if (difficulty === 'easy') return randomMove();
  if (difficulty === 'medium') return mediumMove();
  return minimaxMove();
}

function randomMove() {
  const empty = board.map((v, i) => v === '' ? i : null).filter(v => v !== null);
  return empty[Math.floor(Math.random() * empty.length)];
}

function mediumMove() {
  // Win if possible
  for (const [a, b, c] of WIN_COMBOS) {
    if (board[a] === 'O' && board[b] === 'O' && board[c] === '') return c;
    if (board[a] === 'O' && board[c] === 'O' && board[b] === '') return b;
    if (board[b] === 'O' && board[c] === 'O' && board[a] === '') return a;
  }
  // Block X
  for (const [a, b, c] of WIN_COMBOS) {
    if (board[a] === 'X' && board[b] === 'X' && board[c] === '') return c;
    if (board[a] === 'X' && board[c] === 'X' && board[b] === '') return b;
    if (board[b] === 'X' && board[c] === 'X' && board[a] === '') return a;
  }
  // Center
  if (board[4] === '') return 4;
  // Random
  return randomMove();
}

function minimaxMove() {
  let best = -Infinity, bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i] === '') {
      board[i] = 'O';
      const score = minimax(board, 0, false, -Infinity, Infinity);
      board[i] = '';
      if (score > best) { best = score; bestMove = i; }
    }
  }
  return bestMove;
}

function minimax(b, depth, isMax, alpha, beta) {
  const result = checkWinForBoard(b);
  if (result === 'O') return 10 - depth;
  if (result === 'X') return depth - 10;
  if (b.every(c => c !== '')) return 0;

  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i] === '') {
        b[i] = 'O';
        best = Math.max(best, minimax(b, depth+1, false, alpha, beta));
        b[i] = '';
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i] === '') {
        b[i] = 'X';
        best = Math.min(best, minimax(b, depth+1, true, alpha, beta));
        b[i] = '';
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  }
}

function checkWinForBoard(b) {
  for (const [a, c, d] of WIN_COMBOS) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return null;
}