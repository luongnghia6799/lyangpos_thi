import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Gamepad2, Timer, RefreshCw, AlertTriangle, ArrowLeft, Lightbulb, Trash2, CheckCircle2, Play, Undo, Pause, Trophy, Volume2, VolumeX, RotateCw } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';

// Web Audio API Synthesizer for premium retro feel
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    if (type === 'success') {
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.15, now);
      const freqs = [261.63, 329.63, 392.00, 523.25];
      freqs.forEach((freq, idx) => {
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      });
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(560, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'note') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === 'hint') {
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.1, now);
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.1);
      osc.frequency.setValueAtTime(659.25, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'erase') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (e) {
    console.warn('Audio feedback failed to play:', e);
  }
};

const SOLVED_PATTERN = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [4, 5, 6, 7, 8, 9, 1, 2, 3],
  [7, 8, 9, 1, 2, 3, 4, 5, 6],
  [2, 3, 1, 5, 6, 4, 8, 9, 7],
  [5, 6, 4, 8, 9, 7, 2, 3, 1],
  [8, 9, 7, 2, 3, 1, 5, 6, 4],
  [3, 1, 2, 6, 4, 5, 9, 7, 8],
  [6, 4, 5, 9, 7, 8, 3, 1, 2],
  [9, 7, 8, 3, 1, 2, 6, 4, 5]
];

// Shuffle board using valid transformations
const generateSolvedBoard = () => {
  const board = SOLVED_PATTERN.map(row => [...row]);
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  // Shuffle numbers mapping
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      board[r][c] = numbers[board[r][c] - 1];
    }
  }

  const swapRows = (r1, r2) => {
    const temp = board[r1];
    board[r1] = board[r2];
    board[r2] = temp;
  };

  const swapCols = (c1, c2) => {
    for (let r = 0; r < 9; r++) {
      const temp = board[r][c1];
      board[r][c1] = board[r][c2];
      board[r][c2] = temp;
    }
  };

  // Swap rows and columns within blocks
  for (let block = 0; block < 3; block++) {
    const start = block * 3;
    for (let i = 0; i < 3; i++) {
      const r1 = start + Math.floor(Math.random() * 3);
      const r2 = start + Math.floor(Math.random() * 3);
      if (r1 !== r2) swapRows(r1, r2);
      const c1 = start + Math.floor(Math.random() * 3);
      const c2 = start + Math.floor(Math.random() * 3);
      if (c1 !== c2) swapCols(c1, c2);
    }
  }

  // Swap block rows
  const blockRows = [0, 1, 2];
  for (let i = blockRows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [blockRows[i], blockRows[j]] = [blockRows[j], blockRows[i]];
  }
  const originalRows = board.map(row => [...row]);
  for (let b = 0; b < 3; b++) {
    const target = blockRows[b];
    for (let r = 0; r < 3; r++) {
      board[b * 3 + r] = originalRows[target * 3 + r];
    }
  }

  return board;
};

const createPuzzle = (solution, difficulty) => {
  const board = solution.map(row => row.map(val => ({
    value: val,
    isOriginal: true,
    isHint: false,
    notes: []
  })));

  // Hard: ~30 hints left (51 cleared)
  // Very Hard: ~23 hints left (58 cleared)
  // Master: ~17 hints left (64 cleared)
  const cellsToClear = difficulty === 'master' ? 64 : (difficulty === 'very-hard' ? 58 : 51);
  const positions = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push({ r, c });
    }
  }

  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Clear cells
  for (let i = 0; i < cellsToClear; i++) {
    const { r, c } = positions[i];
    board[r][c].value = 0;
    board[r][c].isOriginal = false;
  }

  return board;
};

const playTetrisSound = (type, enabled) => {
  if (!enabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    
    if (type === 'move') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'rotate') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(290, now);
      osc.frequency.setValueAtTime(390, now + 0.04);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'clear') {
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.08, now);
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.06);
      osc.frequency.setValueAtTime(783.99, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'gameover') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.warn(e);
  }
};

const TETRIS_SHAPES = {
  I: {
    matrix: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: 'bg-gradient-to-br from-[#d7a15c] to-[#a0703c]'
  },
  O: {
    matrix: [
      [1, 1],
      [1, 1]
    ],
    color: 'bg-gradient-to-br from-[#e5c185] to-[#b88c49]'
  },
  T: {
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'bg-gradient-to-br from-[#9c4c34] to-[#6e2b1b]'
  },
  S: {
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: 'bg-gradient-to-br from-[#b47a68] to-[#804d3d]'
  },
  Z: {
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: 'bg-gradient-to-br from-[#ab3a25] to-[#731f0f]'
  },
  J: {
    matrix: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'bg-gradient-to-br from-[#ad7e3e] to-[#7a4f1a]'
  },
  L: {
    matrix: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'bg-gradient-to-br from-[#684c37] to-[#422e20]'
  }
};

function TetrisInfinite({ soundEnabled }) {
  const [grid, setGrid] = useState(() => Array(20).fill(null).map(() => Array(12).fill('')));
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('pos_tetris_highscore') || '0'));
  const [status, setStatus] = useState('idle'); // idle, playing, paused, gameover
  const [isSoftDropping, setIsSoftDropping] = useState(false);

  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPieceType, setNextPieceType] = useState('');
  const [holdPieceType, setHoldPieceType] = useState('');
  const [hasHeld, setHasHeld] = useState(false);
  const [clearingRows, setClearingRows] = useState([]);

  const nextPieceTypeRef = useRef('');
  const setNextPieceTypeSync = useCallback((type) => {
    nextPieceTypeRef.current = type;
    setNextPieceType(type);
  }, []);

  const getNewPiece = useCallback((type) => {
    const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const pType = type || types[Math.floor(Math.random() * 7)];
    const shape = TETRIS_SHAPES[pType];
    return {
      type: pType,
      matrix: shape.matrix.map(row => [...row]),
      color: shape.color,
      x: Math.floor((12 - shape.matrix[0].length) / 2),
      y: pType === 'I' ? -1 : 0
    };
  }, []);

  const checkCollision = useCallback((pieceMatrix, px, py, currentGrid) => {
    for (let r = 0; r < pieceMatrix.length; r++) {
      for (let c = 0; c < pieceMatrix[r].length; c++) {
        if (pieceMatrix[r][c]) {
          const nextX = px + c;
          const nextY = py + r;
          if (nextX < 0 || nextX >= 12 || nextY >= 20) {
            return true;
          }
          if (nextY >= 0 && currentGrid[nextY][nextX]) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const initGame = useCallback(() => {
    setGrid(Array(20).fill(null).map(() => Array(12).fill('')));
    setScore(0);
    setLines(0);
    setLevel(1);
    setHoldPieceType('');
    setHasHeld(false);
    
    const firstType = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'][Math.floor(Math.random() * 7)];
    const secondType = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'][Math.floor(Math.random() * 7)];
    
    setCurrentPiece(getNewPiece(firstType));
    setNextPieceTypeSync(secondType);
    setStatus('playing');
  }, [getNewPiece, setNextPieceTypeSync]);

  const mergePiece = useCallback((pieceToMerge) => {
    const target = pieceToMerge || currentPiece;
    if (!target) return;
    
    let gameOver = false;
    const newGrid = grid.map(row => [...row]);
    
    for (let r = 0; r < target.matrix.length; r++) {
      for (let c = 0; c < target.matrix[r].length; c++) {
        if (target.matrix[r][c]) {
          const gridX = target.x + c;
          const gridY = target.y + r;
          
          if (gridY < 0) {
            gameOver = true;
          } else {
            newGrid[gridY][gridX] = target.color;
          }
        }
      }
    }

    if (gameOver) {
      setStatus('gameover');
      playTetrisSound('gameover', soundEnabled);
      return;
    }

    // Check line clears
    let clearedLines = 0;
    const fullRows = [];
    newGrid.forEach((row, r) => {
      const isFull = row.every(cell => cell !== '');
      if (isFull) {
        clearedLines++;
        fullRows.push(r);
      }
    });

    if (clearedLines > 0) {
      playTetrisSound('clear', soundEnabled);
      setStatus('clearing');
      setClearingRows(fullRows);
      
      const points = [0, 100, 300, 500, 800];
      const newScore = score + (points[clearedLines] || 800) * level;
      setScore(newScore);
      const newLines = lines + clearedLines;
      setLines(newLines);
      setLevel(Math.floor(newLines / 10) + 1);
      
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('pos_tetris_highscore', newScore.toString());
      }
      
      setGrid(newGrid);

      setTimeout(() => {
        const filteredGrid = newGrid.filter((_, i) => !fullRows.includes(i));
        while (filteredGrid.length < 20) {
          filteredGrid.unshift(Array(12).fill(''));
        }
        setGrid(filteredGrid);
        setClearingRows([]);
        setHasHeld(false);
        const nextType = nextPieceTypeRef.current || ['I', 'O', 'T', 'S', 'Z', 'J', 'L'][Math.floor(Math.random() * 7)];
        const newPiece = getNewPiece(nextType);
        if (checkCollision(newPiece.matrix, newPiece.x, newPiece.y, filteredGrid)) {
          setStatus('gameover');
          playTetrisSound('gameover', soundEnabled);
          return;
        }
        setCurrentPiece(newPiece);
        const newNextType = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'][Math.floor(Math.random() * 7)];
        setNextPieceTypeSync(newNextType);
        setStatus('playing');
      }, 900); // Flash duration
      return;
    } else {
      playTetrisSound('move', soundEnabled);
    }

    setGrid(newGrid);
    setHasHeld(false);
    
    // Spawn next piece
    const nextType = nextPieceTypeRef.current || ['I', 'O', 'T', 'S', 'Z', 'J', 'L'][Math.floor(Math.random() * 7)];
    const newPiece = getNewPiece(nextType);
    if (checkCollision(newPiece.matrix, newPiece.x, newPiece.y, newGrid)) {
      setStatus('gameover');
      playTetrisSound('gameover', soundEnabled);
      return;
    }
    setCurrentPiece(newPiece);
    const newNextType = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'][Math.floor(Math.random() * 7)];
    setNextPieceTypeSync(newNextType);
  }, [currentPiece, grid, score, level, lines, highScore, getNewPiece, soundEnabled, setNextPieceTypeSync, checkCollision]);

  const drop = useCallback(() => {
    if (status !== 'playing' || !currentPiece) return;
    
    const nextY = currentPiece.y + 1;
    if (!checkCollision(currentPiece.matrix, currentPiece.x, nextY, grid)) {
      setCurrentPiece(prev => ({ ...prev, y: nextY }));
    } else {
      mergePiece();
    }
  }, [currentPiece, grid, status, checkCollision, mergePiece]);

  // Game loop interval tick
  useEffect(() => {
    if (status !== 'playing') return;
    const intervalTime = isSoftDropping ? 30 : Math.max(80, 800 - (level - 1) * 75);
    const id = setInterval(() => {
      drop();
    }, intervalTime);
    return () => clearInterval(id);
  }, [status, drop, level, isSoftDropping]);

  const moveLeft = useCallback(() => {
    if (status !== 'playing' || !currentPiece) return;
    const nextX = currentPiece.x - 1;
    if (!checkCollision(currentPiece.matrix, nextX, currentPiece.y, grid)) {
      setCurrentPiece(prev => ({ ...prev, x: nextX }));
      playTetrisSound('move', soundEnabled);
    }
  }, [currentPiece, grid, status, checkCollision, soundEnabled]);

  const moveRight = useCallback(() => {
    if (status !== 'playing' || !currentPiece) return;
    const nextX = currentPiece.x + 1;
    if (!checkCollision(currentPiece.matrix, nextX, currentPiece.y, grid)) {
      setCurrentPiece(prev => ({ ...prev, x: nextX }));
      playTetrisSound('move', soundEnabled);
    }
  }, [currentPiece, grid, status, checkCollision, soundEnabled]);

  const rotate = useCallback(() => {
    if (status !== 'playing' || !currentPiece) return;
    
    const n = currentPiece.matrix.length;
    const rotated = Array(n).fill(null).map(() => Array(n).fill(0));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        rotated[c][n - 1 - r] = currentPiece.matrix[r][c];
      }
    }

    // Try rotation
    let didRotate = false;
    let rotatedPiece = null;
    if (!checkCollision(rotated, currentPiece.x, currentPiece.y, grid)) {
      rotatedPiece = { ...currentPiece, matrix: rotated };
      didRotate = true;
    } else {
      // Wall kick simple check
      if (!checkCollision(rotated, currentPiece.x - 1, currentPiece.y, grid)) {
        rotatedPiece = { ...currentPiece, matrix: rotated, x: currentPiece.x - 1 };
        didRotate = true;
      } else if (!checkCollision(rotated, currentPiece.x + 1, currentPiece.y, grid)) {
        rotatedPiece = { ...currentPiece, matrix: rotated, x: currentPiece.x + 1 };
        didRotate = true;
      }
    }

    if (didRotate && rotatedPiece) {
      // Also perform drop logic
      const nextY = rotatedPiece.y + 1;
      if (!checkCollision(rotatedPiece.matrix, rotatedPiece.x, nextY, grid)) {
        setCurrentPiece({ ...rotatedPiece, y: nextY });
      } else {
        mergePiece(rotatedPiece);
      }
      playTetrisSound('rotate', soundEnabled);
    }
  }, [currentPiece, grid, status, checkCollision, soundEnabled, mergePiece]);

  const hardDrop = useCallback(() => {
    if (status !== 'playing' || !currentPiece) return;
    
    let py = currentPiece.y;
    while (!checkCollision(currentPiece.matrix, currentPiece.x, py + 1, grid)) {
      py++;
    }

    const finalPiece = { ...currentPiece, y: py };
    
    // Merge final piece
    let gameOver = false;
    const newGrid = grid.map(row => [...row]);
    
    for (let r = 0; r < finalPiece.matrix.length; r++) {
      for (let c = 0; c < finalPiece.matrix[r].length; c++) {
        if (finalPiece.matrix[r][c]) {
          const gridX = finalPiece.x + c;
          const gridY = finalPiece.y + r;
          if (gridY < 0) {
            gameOver = true;
          } else {
            newGrid[gridY][gridX] = finalPiece.color;
          }
        }
      }
    }

    if (gameOver) {
      setStatus('gameover');
      playTetrisSound('gameover', soundEnabled);
      return;
    }

    let clearedLines = 0;
    const fullRows = [];
    newGrid.forEach((row, r) => {
      const isFull = row.every(cell => cell !== '');
      if (isFull) {
        clearedLines++;
        fullRows.push(r);
      }
    });

    if (clearedLines > 0) {
      playTetrisSound('clear', soundEnabled);
      setStatus('clearing');
      setClearingRows(fullRows);
      
      const points = [0, 100, 300, 500, 800];
      const newScore = score + (points[clearedLines] || 800) * level + 20; // bonus points for hard drop
      setScore(newScore);
      const newLines = lines + clearedLines;
      setLines(newLines);
      setLevel(Math.floor(newLines / 10) + 1);
      
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('pos_tetris_highscore', newScore.toString());
      }
      
      setGrid(newGrid);

      setTimeout(() => {
        const filteredGrid = newGrid.filter((_, i) => !fullRows.includes(i));
        while (filteredGrid.length < 20) {
          filteredGrid.unshift(Array(12).fill(''));
        }
        setGrid(filteredGrid);
        setClearingRows([]);
        setHasHeld(false);
        const nextType = nextPieceTypeRef.current || ['I', 'O', 'T', 'S', 'Z', 'J', 'L'][Math.floor(Math.random() * 7)];
        const newPiece = getNewPiece(nextType);
        if (checkCollision(newPiece.matrix, newPiece.x, newPiece.y, filteredGrid)) {
          setStatus('gameover');
          playTetrisSound('gameover', soundEnabled);
          return;
        }
        setCurrentPiece(newPiece);
        const newNextType = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'][Math.floor(Math.random() * 7)];
        setNextPieceTypeSync(newNextType);
        setStatus('playing');
      }, 900); // Flash duration
      return;
    }

    setGrid(newGrid);
    setHasHeld(false);
    const nextType = nextPieceTypeRef.current || ['I', 'O', 'T', 'S', 'Z', 'J', 'L'][Math.floor(Math.random() * 7)];
    const newPiece = getNewPiece(nextType);
    if (checkCollision(newPiece.matrix, newPiece.x, newPiece.y, newGrid)) {
      setStatus('gameover');
      playTetrisSound('gameover', soundEnabled);
      return;
    }
    setCurrentPiece(newPiece);
    const newNextType = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'][Math.floor(Math.random() * 7)];
    setNextPieceTypeSync(newNextType);
  }, [currentPiece, grid, status, score, level, lines, highScore, getNewPiece, checkCollision, soundEnabled, setNextPieceTypeSync]);

  const holdPiece = useCallback(() => {
    if (status !== 'playing' || hasHeld || !currentPiece) return;
    
    const typeToHold = currentPiece.type;
    if (holdPieceType === '') {
      setHoldPieceType(typeToHold);
      const nextType = nextPieceTypeRef.current || ['I', 'O', 'T', 'S', 'Z', 'J', 'L'][Math.floor(Math.random() * 7)];
      const newPiece = getNewPiece(nextType);
      if (checkCollision(newPiece.matrix, newPiece.x, newPiece.y, grid)) {
        setStatus('gameover');
        playTetrisSound('gameover', soundEnabled);
        return;
      }
      setCurrentPiece(newPiece);
      const newNextType = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'][Math.floor(Math.random() * 7)];
      setNextPieceTypeSync(newNextType);
    } else {
      const prevHold = holdPieceType;
      setHoldPieceType(typeToHold);
      const newPiece = getNewPiece(prevHold);
      if (checkCollision(newPiece.matrix, newPiece.x, newPiece.y, grid)) {
        setStatus('gameover');
        playTetrisSound('gameover', soundEnabled);
        return;
      }
      setCurrentPiece(newPiece);
    }
    setHasHeld(true);
    playTetrisSound('rotate', soundEnabled);
  }, [currentPiece, holdPieceType, hasHeld, status, getNewPiece, soundEnabled, setNextPieceTypeSync, grid, checkCollision]);

  const actionsRef = useRef({});
  useEffect(() => {
    actionsRef.current = { moveLeft, moveRight, rotate, drop, hardDrop, holdPiece, status };
  }, [moveLeft, moveRight, rotate, drop, hardDrop, holdPiece, status]);

  // Keyboard Event handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      const actions = actionsRef.current;
      if (actions.status !== 'playing') return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          actions.moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          actions.moveRight();
          break;
        case 'ArrowUp':
          e.preventDefault();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setIsSoftDropping(true);
          break;
        case 'Space':
        case ' ':
          e.preventDefault();
          actions.rotate();
          break;
        case 'Shift':
        case 'c':
        case 'C':
          e.preventDefault();
          actions.holdPiece();
          break;
        case 'p':
        case 'P':
        case 'Escape':
          e.preventDefault();
          setStatus('paused');
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowDown') {
        setIsSoftDropping(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const displayGrid = grid.map(row => [...row]);
  if (currentPiece && status === 'playing') {
    for (let r = 0; r < currentPiece.matrix.length; r++) {
      for (let c = 0; c < currentPiece.matrix[r].length; c++) {
        if (currentPiece.matrix[r][c]) {
          const gridX = currentPiece.x + c;
          const gridY = currentPiece.y + r;
          if (gridY >= 0 && gridY < 20 && gridX >= 0 && gridX < 12) {
            displayGrid[gridY][gridX] = currentPiece.color;
          }
        }
      }
    }
  }

  // Mini preview grid
  const renderPreview = (type) => {
    if (!type) return null;
    const shape = TETRIS_SHAPES[type];
    const matrix = shape.matrix;
    return (
      <div 
        className="grid gap-0 p-2 bg-transparent"
        style={{ gridTemplateColumns: `repeat(${matrix[0].length}, minmax(0, 1fr))` }}
      >
        {matrix.map((row, r) =>
          row.map((cell, c) => {
            if (!cell) return <div key={`${r}-${c}`} className="w-4 h-4 bg-transparent" />;
            
            const hasTop = r > 0 && matrix[r - 1][c] === 1;
            const hasBottom = r < matrix.length - 1 && matrix[r + 1][c] === 1;
            const hasLeft = c > 0 && matrix[r][c - 1] === 1;
            const hasRight = c < matrix[r].length - 1 && matrix[r][c + 1] === 1;

            const style = {
              borderTop: hasTop ? 'none' : '1px solid rgba(255, 255, 255, 0.25)',
              borderLeft: hasLeft ? 'none' : '1px solid rgba(255, 255, 255, 0.25)',
              borderBottom: hasBottom ? 'none' : '1px solid rgba(0, 0, 0, 0.45)',
              borderRight: hasRight ? 'none' : '1px solid rgba(0, 0, 0, 0.45)',
              borderTopLeftRadius: (!hasTop && !hasLeft) ? '4px' : '0px',
              borderTopRightRadius: (!hasTop && !hasRight) ? '4px' : '0px',
              borderBottomLeftRadius: (!hasBottom && !hasLeft) ? '4px' : '0px',
              borderBottomRightRadius: (!hasBottom && !hasRight) ? '4px' : '0px',
            };

            return (
              <div
                key={`${r}-${c}`}
                style={style}
                className={`w-4 h-4 ${shape.color} tetris-wood-block`}
              />
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-stretch justify-center gap-8 p-2 md:p-6 h-full overflow-hidden select-none">
      
      {/* Game Board Container (Left Column) */}
      <div className="flex-1 flex justify-center md:justify-end">
        <div className="relative aspect-[12/20] h-full max-h-[85vh] bg-transparent border-4 border-slate-700/80 dark:border-slate-800 rounded-[24px] overflow-hidden flex ring-1 ring-white/10">
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-20 pointer-events-none">
            {Array(240).fill(null).map((_, i) => (
              <div key={i} className="border-[0.5px] border-slate-700/30 dark:border-slate-800/50" />
            ))}
          </div>
          <style>{`
            .tetris-wood-block {
              position: relative;
              box-shadow: 
                inset 1px 1px 0px rgba(255, 255, 255, 0.22),
                inset -1.5px -1.5px 0px rgba(0, 0, 0, 0.45),
                0 3px 5px -1px rgba(0, 0, 0, 0.35);
              overflow: hidden;
            }
            .tetris-wood-block::after {
              content: '';
              position: absolute;
              inset: 0;
              background-image: 
                repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.04) 0px, rgba(255, 255, 255, 0.04) 1.5px, transparent 1.5px, transparent 6px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0.15) 100%);
              mix-blend-mode: overlay;
              pointer-events: none;
            }
            .tetris-wood-block::before {
              content: '';
              position: absolute;
              top: 15%;
              left: 15%;
              right: 15%;
              bottom: 15%;
              border: 0.5px solid rgba(0, 0, 0, 0.12);
              border-radius: 1px;
              pointer-events: none;
              opacity: 0.65;
            }
            @keyframes tetrisClearFlash {
              0% { 
                transform: scale(1) rotate(0deg); 
                filter: brightness(1.4) saturate(1.4) drop-shadow(0 0 4px #f59e0b); 
                opacity: 1; 
                z-index: 50;
              }
              30% { 
                transform: scale(1.18) rotate(3deg); 
                filter: brightness(2) saturate(2) drop-shadow(0 0 12px #ef4444) blur(0.5px); 
                background-color: #f97316; 
                box-shadow: 0 0 16px #ef4444, inset 0 0 8px #fff; 
                opacity: 1; 
                z-index: 50; 
              }
              100% { 
                transform: scale(0) rotate(-12deg) translateY(-18px); 
                filter: brightness(2.5) blur(5px); 
                opacity: 0; 
                z-index: 50;
              }
            }
          `}</style>
          <div className="w-full h-full grid grid-cols-12 grid-rows-20 p-[2px]">
            {displayGrid.map((row, r) =>
              row.map((cell, c) => {
                const isClearing = clearingRows.includes(r);
                let cellStyle = {};
                let cellClass = 'bg-transparent border-transparent';
                
                if (cell && !isClearing) {
                  const hasTop = r > 0 && displayGrid[r - 1][c] === cell;
                  const hasBottom = r < 19 && displayGrid[r + 1][c] === cell;
                  const hasLeft = c > 0 && displayGrid[r][c - 1] === cell;
                  const hasRight = c < 11 && displayGrid[r][c + 1] === cell;

                  cellClass = `${cell} tetris-wood-block shadow-md`;
                  cellStyle = {
                    borderTop: hasTop ? 'none' : '1.5px solid rgba(255, 255, 255, 0.25)',
                    borderLeft: hasLeft ? 'none' : '1.5px solid rgba(255, 255, 255, 0.25)',
                    borderBottom: hasBottom ? 'none' : '1.5px solid rgba(0, 0, 0, 0.45)',
                    borderRight: hasRight ? 'none' : '1.5px solid rgba(0, 0, 0, 0.45)',
                    borderTopLeftRadius: (!hasTop && !hasLeft) ? '6px' : '0px',
                    borderTopRightRadius: (!hasTop && !hasRight) ? '6px' : '0px',
                    borderBottomLeftRadius: (!hasBottom && !hasLeft) ? '6px' : '0px',
                    borderBottomRightRadius: (!hasBottom && !hasRight) ? '6px' : '0px',
                  };
                } else if (isClearing) {
                  cellClass = `${cell || 'bg-orange-500'} tetris-wood-block`;
                  cellStyle = {
                    animation: 'tetrisClearFlash 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                    animationDelay: `${c * 0.035}s`,
                    borderRadius: '4px',
                  };
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    style={cellStyle}
                    className={cellClass}
                  />
                );
              })
            )}
          </div>

          {/* Overlay screens */}
          {status === 'idle' && (
            <div className="absolute inset-0 bg-[#0a0f1d]/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
              <Gamepad2 className="text-primary animate-pulse mb-3" size={56} />
              <h3 className="text-2xl font-black uppercase text-primary tracking-widest drop-shadow-[0_0_15px_var(--color-primary)]">TETRIS INFINITE</h3>
              <p className="text-sm text-slate-300 max-w-[220px] mt-2 mb-6 font-bold">Thách thức không giới hạn, xếp gạch cổ điển.</p>
              <button
                onClick={initGame}
                className="px-8 py-3.5 bg-gradient-to-r from-primary to-[#4a7c59] text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-[0_0_20px_rgba(45,80,22,0.4)] hover:scale-105 active:scale-95 transition-all border border-white/20"
              >
                BẮT ĐẦU CHƠI
              </button>
            </div>
          )}

          {status === 'paused' && (
            <div className="absolute inset-0 bg-[#0a0f1d]/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
              <Pause className="text-amber-500 animate-bounce mb-3" size={56} />
              <h3 className="text-2xl font-black uppercase text-amber-500 tracking-widest drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">ĐANG TẠM DỪNG</h3>
              <button
                onClick={() => setStatus('playing')}
                className="px-8 py-3.5 bg-amber-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all mt-6"
              >
                TIẾP TỤC
              </button>
            </div>
          )}

          {status === 'gameover' && (
            <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-4">
              <AlertTriangle className="text-red-500 animate-pulse mb-3" size={56} />
              <h3 className="text-3xl font-black uppercase text-red-500 tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] mb-2">THUA CUỘC</h3>
              <div className="bg-black/40 rounded-2xl px-6 py-4 mb-6 border border-white/10">
                <p className="text-sm text-slate-300 font-bold uppercase tracking-wider mb-1">Điểm của bạn</p>
                <div className="text-4xl font-black text-white">{score}</div>
              </div>
              <button
                onClick={initGame}
                className="px-8 py-3.5 bg-gradient-to-r from-red-600 to-red-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95 transition-all border border-white/20"
              >
                CHƠI LẠI NGAY
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Stats & Controls */}
      <div className="w-full md:w-72 shrink-0 flex flex-col gap-4 self-stretch justify-start h-full max-h-[750px]">
        
        {/* Next & Hold Pieces */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-transparent border border-border p-4 rounded-[20px] flex flex-col items-center shadow-sm backdrop-blur-md">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mb-3">Tiếp theo</div>
            <div className="h-16 flex items-center justify-center">
              {nextPieceType ? renderPreview(nextPieceType) : <div className="text-xs text-slate-500 font-bold">Đang tải</div>}
            </div>
          </div>
          <div className="bg-transparent border border-border p-4 rounded-[20px] flex flex-col items-center shadow-sm backdrop-blur-md">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mb-3">Giữ (Shift)</div>
            <div className="h-16 flex items-center justify-center">
              {holdPieceType ? renderPreview(holdPieceType) : <div className="text-xs text-slate-500 font-bold">Trống</div>}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-transparent border border-border p-5 rounded-[20px] flex flex-col gap-3 shadow-sm backdrop-blur-md">
          <div className="w-full flex justify-between items-center bg-transparent rounded-2xl p-3.5 border border-border">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
              <Trophy size={14} className="text-amber-500" /> Kỷ lục
            </div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-500">{highScore}</div>
          </div>
          <div className="w-full flex justify-between items-center bg-transparent rounded-2xl p-3.5 border border-border">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Điểm số</div>
            <div className="text-3xl font-black text-slate-800 dark:text-white drop-shadow-sm">{score}</div>
          </div>
          <div className="w-full grid grid-cols-2 gap-3 mt-1">
             <div className="bg-transparent rounded-2xl p-3 flex flex-col items-center border border-border">
               <div className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mb-1">Cấp độ</div>
               <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{level}</div>
             </div>
             <div className="bg-transparent rounded-2xl p-3 flex flex-col items-center border border-border">
               <div className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mb-1">Đã xóa</div>
               <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{lines}</div>
             </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-3 mt-auto">
          {status === 'playing' && (
            <button
              onClick={() => setStatus('paused')}
              className="w-full py-3.5 bg-transparent border border-amber-500/20 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/50 hover:shadow-[0_0_10px_rgba(245,158,11,0.15)] active:scale-95 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Pause size={16} /> Tạm dừng (P)
            </button>
          )}
          
          <button
            onClick={initGame}
            className="w-full py-3.5 bg-transparent border border-border text-slate-300 hover:text-white hover:bg-white/5 hover:border-white/30 hover:shadow-[0_0_10px_rgba(255,255,255,0.05)] active:scale-95 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} /> Bắt đầu lại
          </button>
        </div>

        {/* Virtual Controller */}
        <div className="grid grid-cols-3 gap-2 bg-transparent border border-border rounded-2xl p-4 backdrop-blur-md">
          <div />
          <div />
          <div />
          <button onClick={moveLeft} className="p-4 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 border border-border text-slate-700 dark:text-white rounded-xl flex items-center justify-center transition-all active:scale-95"><ArrowLeft size={20} /></button>
          <button onClick={rotate} className="p-4 bg-primary text-white shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.4)] hover:bg-primary/90 rounded-xl flex items-center justify-center transition-all active:scale-95 font-bold text-xs tracking-wider">ROTATE</button>
          <button onClick={moveRight} className="p-4 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 border border-border text-slate-700 dark:text-white rounded-xl flex items-center justify-center transition-all active:scale-95"><ArrowLeft size={20} className="rotate-180" /></button>
          <div />
          <button onClick={drop} className="p-4 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 border border-border text-slate-700 dark:text-white rounded-xl flex items-center justify-center transition-all active:scale-95"><ArrowLeft size={20} className="-rotate-90" /></button>
          <div />
        </div>

      </div>
    </div>
  );
}

function BBTanGame({ soundEnabled }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(1);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('pos_bbtan_highscore') || '0'));
  const [status, setStatus] = useState('idle'); // idle, playing, gameover
  const [ballCount, setBallCount] = useState(1);
  const [settings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_bbtan_settings')) || {}; } catch(e) { return {}; }
  });

  const [gameSpeed, setGameSpeed] = useState(settings.gameSpeed !== undefined ? settings.gameSpeed : 1);
  const gameSpeedRef = useRef(gameSpeed);
  useEffect(() => { gameSpeedRef.current = gameSpeed; }, [gameSpeed]);
  
  const [ballSize, setBallSize] = useState(settings.ballSize || 6);
  const ballSizeRef = useRef(ballSize);
  useEffect(() => { ballSizeRef.current = ballSize; }, [ballSize]);
  
  const [ballColor, setBallColor] = useState(settings.ballColor || '#06b6d4');
  const ballColorRef = useRef(ballColor);
  useEffect(() => { ballColorRef.current = ballColor; }, [ballColor]);

  const [brickColor, setBrickColor] = useState(settings.brickColor || '#a0522d');
  const brickColorRef = useRef(brickColor);
  useEffect(() => { brickColorRef.current = brickColor; }, [brickColor]);

  const [aimColor, setAimColor] = useState(settings.aimColor || '#06b6d4');
  const aimColorRef = useRef(aimColor);
  useEffect(() => { aimColorRef.current = aimColor; }, [aimColor]);
  
  const [gameMode, setGameMode] = useState(settings.gameMode || 'advanced'); // classic, advanced
  const gameModeRef = useRef(gameMode);
  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);

  const [ballType, setBallType] = useState(settings.ballType || 'solid');
  const ballTypeRef = useRef(ballType);
  useEffect(() => { ballTypeRef.current = ballType; }, [ballType]);

  useEffect(() => {
    localStorage.setItem('pos_bbtan_settings', JSON.stringify({
      gameSpeed, ballSize, ballColor, brickColor, aimColor, gameMode, ballType
    }));
  }, [gameSpeed, ballSize, ballColor, brickColor, aimColor, gameMode, ballType]);
  
  const [hasSavedGame, setHasSavedGame] = useState(() => !!localStorage.getItem('pos_bbtan_state'));
  
  // Game state held in refs for the animation loop
  const stateRef = useRef({
    status: 'idle', // idle, aiming, shooting, gameover
    level: 1,
    balls: [],
    bricks: [],
    items: [], // powerups like + balls, lasers
    particles: [],
    shooterX: 230,
    shooterY: 759,
    firstLandedX: null,
    aimAngle: -Math.PI / 2,
    isAiming: false,
    mousePos: { x: 230, y: 0 },
    ballCount: 1,
    ballsToLaunch: 0,
    launchTimer: 0,
    launchPos: { x: 230, y: 759 },
    landedCount: 0,
    hasRevived: false,
    shakeMagnitude: 0,
    shakeTimer: 0,
    comboCount: 0,
    multiplier: 1,
    multiplierTurns: 0,
    bounceFloorCharges: 0
  });

  const startLoopRef = useRef(null);

let sharedAudioCtx = null;
const getAudioCtx = () => {
  if (!sharedAudioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      sharedAudioCtx = new AudioContext();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

  const playSynthSound = useCallback((type) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      
      if (type === 'hit') {
        const combo = arguments[1] || 0;
        const baseFreq = 1200 + Math.min(1200, combo * 30);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq + Math.random() * 50, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'break') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.45);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'item') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.6);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (e) {
      console.warn(e);
    }
  }, [soundEnabled]);

  const initGame = useCallback((loadSaved = false) => {
    const state = stateRef.current;
    
    if (loadSaved) {
       const saved = localStorage.getItem('pos_bbtan_state');
       if (saved) {
         try {
           const parsed = JSON.parse(saved);
           state.level = parsed.level;
           state.ballCount = parsed.ballCount;
           state.bricks = parsed.bricks || [];
           state.items = parsed.items || [];
           state.shooterX = parsed.shooterX || 230;
           state.shooterY = 765 - 32;
           state.balls = [];
           state.particles = [];
           state.firstLandedX = null;
           state.isAiming = false;
           state.landedCount = 0;
           
           setScore(parsed.level);
           setBallCount(parsed.ballCount);
           setStatus('playing');
           state.status = 'aiming';
           return;
         } catch (e) {}
       }
    }

    state.status = 'aiming';
    state.level = 1;
    state.ballCount = 1;
    state.balls = [];
    state.bricks = [];
    state.items = [];
    state.particles = [];
    state.shooterX = 230;
    state.shooterY = 765 - 32;
    state.firstLandedX = null;
    state.isAiming = false;
    state.landedCount = 0;
    state.hasRevived = false;
    state.comboCount = 0;
    state.multiplier = 1;
    state.multiplierTurns = 0;
    state.bounceFloorCharges = 0;
    
    setScore(1);
    setStatus('playing');
    setBallCount(1);
    
    // Spawn first row of bricks
    spawnRow(state);
    startLoopRef.current && startLoopRef.current();
  }, []);

  const handleRevive = (accept) => {
    const state = stateRef.current;
    if (accept) {
      // Clear normal bottom bricks (targetY >= 400)
      state.bricks = state.bricks.filter(b => b.type === 'boss' || b.targetY < 400);
      
      // Push any Bosses back to the top of the screen so they don't trigger immediate gameover
      state.bricks.forEach(b => {
        if (b.type === 'boss') {
          b.row = 0;
          b.y = 6;
          b.targetY = 6;
        }
      });
      
      state.hasRevived = true;
      state.status = 'aiming';
      state.multiplier = 1;
      state.multiplierTurns = 0;
      setStatus('playing');
      playSynthSound('laser');

      // Save the revived state to localStorage so it is persistent
      localStorage.setItem('pos_bbtan_state', JSON.stringify({
         level: state.level,
         ballCount: state.ballCount,
         bricks: state.bricks,
         items: state.items,
         shooterX: state.shooterX
      }));
      setHasSavedGame(true);
      startLoopRef.current && startLoopRef.current();
    } else {
      state.status = 'gameover';
      setStatus('gameover');
      playSynthSound('gameover');
      localStorage.removeItem('pos_bbtan_state');
    }
  };

  const spawnRow = (state) => {
    const isAdvanced = gameModeRef.current === 'advanced';
    const cols = 8;
    const brickSize = isAdvanced ? 55 : 50;
    const padding = isAdvanced ? 2 : 6;
    const startY = isAdvanced ? 2 : 6;
    const startX = isAdvanced ? 2 : 6;
    
    // Push existing bricks down by one row height
    state.bricks.forEach(b => {
      b.row++;
      b.targetY += brickSize + padding;
    });
    
    state.items.forEach(item => {
      item.row++;
      item.targetY += brickSize + padding;
    });

    // Check if any brick has reached the danger zone
    const reachedBottom = state.bricks.some(b => {
      const h = b.type === 'boss' ? b.h : (b.h || (isAdvanced ? 55 : 50));
      return b.targetY + h >= 750;
    });
    
    if (reachedBottom) {
      if (!state.hasRevived) {
        state.status = 'revive_prompt';
        setStatus('revive_prompt');
        return;
      } else {
        state.status = 'gameover';
        setStatus('gameover');
        playSynthSound('gameover');
        localStorage.removeItem('pos_bbtan_state');
        setHasSavedGame(false);
        return;
      }
    }

    if (isAdvanced && state.level > 0 && state.level % 50 === 0) {
      // Spawn Boss
      state.bricks.push({
        type: 'boss',
        col: 2, row: 0, 
        x: 2 * (brickSize + padding) + startX, y: startY - brickSize * 2, targetY: startY,
        w: brickSize * 4 + padding * 3, h: brickSize * 4 + padding * 3,
        hp: state.level * 30, maxHp: state.level * 30,
        isDouble: false, isBomb: false
      });
      playSynthSound('laser'); // Announce boss
      state.shakeTimer = 500;
      state.shakeMagnitude = 10;
    } else {
      // Spawn new row elements at the top
      for (let c = 0; c < cols; c++) {
        const x = c * (brickSize + padding) + startX;
        const y = startY;
        const rand = Math.random();
        
        if (isAdvanced) {
          if (rand < 0.35) {
            // Spawn normal square brick
            const isDouble = Math.random() < 0.15;
            const hp = isDouble ? state.level * 2 : state.level;
            state.bricks.push({
              type: 'square',
              col: c,
              row: 0,
              x,
              y,
              targetY: y,
              w: brickSize,
              h: brickSize,
              hp,
              maxHp: hp,
              isDouble,
              isBomb: false
            });
          } else if (rand < 0.38) {
            // Spawn bomb brick (3% spawn rate)
            const isDouble = Math.random() < 0.15;
            const hp = isDouble ? state.level * 2 : state.level;
            state.bricks.push({
              type: 'bomb',
              col: c,
              row: 0,
              x,
              y,
              targetY: y,
              w: brickSize,
              h: brickSize,
              hp,
              maxHp: hp,
              isDouble,
              isBomb: true
            });
          } else if (rand < 0.48) {
            // Spawn triangle brick (reflects diagonally)
            const isDouble = Math.random() < 0.15;
            const hp = isDouble ? state.level * 2 : state.level;
            const dir = Math.floor(Math.random() * 4); // 4 diagonal orientations
            state.bricks.push({
              type: 'triangle',
              dir,
              col: c,
              row: 0,
              x,
              y,
              targetY: y,
              w: brickSize,
              h: brickSize,
              hp,
              maxHp: hp,
              isDouble
            });
          } else if (rand < 0.58) {
            // Spawn extra ball item (+)
            state.items.push({
              type: 'extra_ball', col: c, row: 0, x: x + brickSize/2, y: y + brickSize/2, targetY: y + brickSize/2, collected: false
            });
          } else if (rand < 0.61) {
            // Spawn lightning item
            state.items.push({
              type: 'lightning', col: c, row: 0, x: x + brickSize/2, y: y + brickSize/2, targetY: y + brickSize/2, collected: false
            });
          } else if (rand < 0.65) {
            // Spawn laser item (clears row/col when hit)
            state.items.push({
              type: 'laser', col: c, row: 0, x: x + brickSize/2, y: y + brickSize/2, targetY: y + brickSize/2, collected: false
            });
          } else if (rand < 0.68) {
            // Spawn multiplier item (x2 or x3 for 2 turns)
            const factor = Math.random() < 0.75 ? 2 : 3;
            state.items.push({
              type: `multiplier_x${factor}`, col: c, row: 0, x: x + brickSize/2, y: y + brickSize/2, targetY: y + brickSize/2, collected: false
            });
          } else if (rand < 0.71) {
            // Spawn bounce item
            state.items.push({
              type: 'bounce', col: c, row: 0, x: x + brickSize/2, y: y + brickSize/2, targetY: y + brickSize/2, collected: false
            });
          } else if (rand < 0.74) {
            // Spawn scatter item
            state.items.push({
              type: 'scatter', col: c, row: 0, x: x + brickSize/2, y: y + brickSize/2, targetY: y + brickSize/2, collected: false
            });
          }
        } else {
          // Classic Mode Spawning
          if (rand < 0.35) {
            state.bricks.push({
              type: 'square',
              col: c,
              row: 0,
              x,
              y,
              targetY: y,
              w: brickSize,
              h: brickSize,
              hp: state.level,
              maxHp: state.level,
              isDouble: false,
              isBomb: false
            });
          } else if (rand < 0.45) {
            state.items.push({
              type: 'extra_ball', col: c, row: 0, x: x + brickSize/2, y: y + brickSize/2, targetY: y + brickSize/2, collected: false
            });
          } else if (rand < 0.48) {
            state.items.push({
              type: 'bounce', col: c, row: 0, x: x + brickSize/2, y: y + brickSize/2, targetY: y + brickSize/2, collected: false
            });
          } else if (rand < 0.51) {
            state.items.push({
              type: 'scatter', col: c, row: 0, x: x + brickSize/2, y: y + brickSize/2, targetY: y + brickSize/2, collected: false
            });
          }
        }
      }
    }
  };

  // Generate particles when a brick is hit or broken
  const addParticles = (x, y, color, count = 6, type = 'circle') => {
    const state = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = type === 'shatter' ? Math.random() * 4 + 2 : Math.random() * 3 + 1;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        type,
        size: type === 'shatter' ? Math.random() * 6 + 4 : Math.random() * 4 + 2,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.4
      });
    }
  };

  // Main Canvas Render and Game Logic Loop
  useEffect(() => {
    if (status !== 'playing') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId = null;
    let isLooping = false;

    const needsAnimation = () => {
      const state = stateRef.current;
      if (state.status === 'shooting') return true;
      if (state.status === 'aiming' && state.isAiming) return true;
      if (state.shakeTimer > 0) return true;
      if (state.particles && state.particles.length > 0) return true;
      if (state.effects && state.effects.length > 0) return true;
      
      const bricksMoving = state.bricks.some(b => b.y < b.targetY);
      if (bricksMoving) return true;
      
      const itemsMoving = state.items.some(item => item.y < item.targetY);
      if (itemsMoving) return true;
      
      return false;
    };

    const startLoop = () => {
      if (isLooping) return;
      isLooping = true;
      loop();
    };
    
    startLoopRef.current = startLoop;
    
    const update = () => {
      const state = stateRef.current;
      const currentSpeed = gameSpeedRef.current;
      const bs = ballSizeRef.current;
      
      const applyBallDamage = (brick, ball) => {
        let damage = 1;
        const type = ballTypeRef.current;
        
        if (type === 'star' && Math.random() < 0.25) {
          damage = 2;
          addParticles(brick.x + 25, brick.y + 25, '#fbbf24', 6, 'star');
          playSynthSound('item');
        }
        else if (type === 'soccer' && Math.random() < 0.30) {
          damage = 2;
          state.shakeMagnitude = 6;
          state.shakeTimer = 8;
          addParticles(brick.x + 25, brick.y + 25, '#ffffff', 8, 'circle');
          playSynthSound('laser');
        }
        else if (type === 'ghost' && Math.random() < 0.15) {
          damage = 2;
          addParticles(brick.x + 25, brick.y + 25, '#cbd5e1', 5, 'circle');
        }

        brick.hp -= damage;
        
        if (type === 'aura' && Math.random() < 0.15) {
          addParticles(brick.x + 25, brick.y + 25, '#ef4444', 12, 'circle');
          playSynthSound('laser');
          
          const row = brick.row;
          const col = brick.col;
          state.bricks.forEach(other => {
            const dRow = Math.abs(other.row - row);
            const dCol = Math.abs(other.col - col);
            if ((dRow === 1 && dCol === 0) || (dRow === 0 && dCol === 1)) {
              other.hp -= 1;
            }
          });
        }
      };
      
      // Interpolate positions of bricks for smooth drops
      state.bricks.forEach(b => {
        if (b.y < b.targetY) {
          b.y += (b.targetY - b.y) * 0.15;
          if (b.targetY - b.y < 0.1) b.y = b.targetY;
        }
      });
      state.items.forEach(item => {
        if (item.y < item.targetY) {
          item.y += (item.targetY - item.y) * 0.15;
          if (item.targetY - item.y < 0.1) item.y = item.targetY;
        }
      });

      // Update particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.type === 'shatter') {
          p.vy += 0.2; // gravity
          p.rotation += p.vRot;
          p.life -= 0.015;
        } else {
          p.life -= 0.03;
        }
        if (p.life <= 0) state.particles.splice(i, 1);
      }

      // Handle ball shooting queue
      if (state.status === 'shooting' && state.ballsToLaunch > 0) {
        state.launchTimer += currentSpeed;
        if (state.launchTimer >= 24) { // interval between balls
          state.launchTimer -= 24;
          const speed = 2.8;
          state.balls.push({
            x: state.launchPos.x,
            y: state.launchPos.y,
            vx: Math.cos(state.aimAngle) * speed,
            vy: Math.sin(state.aimAngle) * speed,
            landed: false
          });
          state.ballsToLaunch--;
        }
      }

      // Update ball positions & check collisions
      state.balls.forEach(ball => {
        if (ball.landed) return;
        
        // Prevent near-perfect horizontal bounces from getting stuck forever
        if (ball.vx !== 0 && Math.abs(ball.vy) < 0.25) {
          ball.vy = ball.vy < 0 ? -0.25 : 0.25;
        }
        
        // Move ball step-by-step for accurate collision detection
        const steps = Math.max(3, Math.ceil(3 * currentSpeed));

        for (let step = 0; step < steps; step++) {
          ball.x += (ball.vx * currentSpeed) / steps;
          ball.y += (ball.vy * currentSpeed) / steps;
          
          if (!ball.trail) ball.trail = [];
          ball.trail.push({ x: ball.x, y: ball.y });
          if (ball.trail.length > 4) ball.trail.shift();
          
          // Wall boundaries bouncing
          if (ball.x <= bs) {
            ball.x = bs;
            ball.vx = -ball.vx;
            playSynthSound('hit', 0);
          }
          if (ball.x >= 460 - bs) {
            ball.x = 460 - bs;
            ball.vx = -ball.vx;
            playSynthSound('hit', 0);
          }
          if (ball.y <= bs) {
            ball.y = bs;
            ball.vy = -ball.vy;
            playSynthSound('hit', 0);
          }
          
          // Bouncy Floor check
          if (state.bounceFloorCharges > 0 && ball.y >= 710 && ball.vy > 0) {
            ball.y = 710;
            ball.vy = -Math.abs(ball.vy);
            state.bounceFloorCharges--;
            playSynthSound('hit', 5);
            addParticles(ball.x, 710, '#06b6d4', 8, 'circle');
            break;
          }
          
          // Landing on bottom wall
          if (ball.y >= 765 - 32) {
            ball.y = 765 - 32;
            ball.vx = 0;
            ball.vy = 0;
            ball.landed = true;
            
            state.landedCount++;
            
            if (state.firstLandedX === null) {
              state.firstLandedX = ball.x;
            }
            break;
          }

          // Check collisions with bricks
          for (let i = state.bricks.length - 1; i >= 0; i--) {
            const b = state.bricks[i];
            const bWidth = b.w || 50;
            const bHeight = b.h || 50;
            const size = b.w || 50;
            
            if (ball.x + bs >= b.x && ball.x - bs <= b.x + bWidth &&
                ball.y + bs >= b.y && ball.y - bs <= b.y + bHeight) {
              
              if (b.type === 'square' || b.type === 'bomb' || b.type === 'boss') {
                const distL = Math.abs((ball.x) - b.x);
                const distR = Math.abs((ball.x) - (b.x + bWidth));
                const distT = Math.abs((ball.y) - b.y);
                const distB = Math.abs((ball.y) - (b.y + bHeight));
                
                let reflected = false;
                const minDist = Math.min(distL, distR, distT, distB);
                
                const isRainbowPierce = (ballTypeRef.current === 'rainbow' && Math.random() < 0.20);
                
                if (isRainbowPierce) {
                  applyBallDamage(b, ball);
                  state.comboCount++;
                  addParticles(ball.x, ball.y, '#a855f7', 4, 'circle');
                  playSynthSound('hit', state.comboCount);
                } else {
                  if (minDist === distL) {
                    ball.vx = -Math.abs(ball.vx);
                    ball.x = b.x - bs;
                    reflected = true;
                  } else if (minDist === distR) {
                    ball.vx = Math.abs(ball.vx);
                    ball.x = b.x + bWidth + bs;
                    reflected = true;
                  } else if (minDist === distT) {
                    ball.vy = -Math.abs(ball.vy);
                    ball.y = b.y - bs;
                    reflected = true;
                  } else {
                    ball.vy = Math.abs(ball.vy);
                    ball.y = b.y + bHeight + bs;
                    reflected = true;
                  }
                  
                  if (reflected) {
                    applyBallDamage(b, ball);
                    state.comboCount++;
                    addParticles(ball.x, ball.y, '#e5c185', 3);
                    playSynthSound('hit', state.comboCount);
                  }
                }
              } else if (b.type === 'triangle') {
                const prevX = ball.x - (ball.vx * currentSpeed / steps) - b.x;
                const prevY = ball.y - (ball.vy * currentSpeed / steps) - b.y;
                const bx = ball.x - b.x;
                const by = ball.y - b.y;
                
                let isSolid = false;
                let wasSolid = false;
                
                const prevInAABB = (prevX >= -bs && prevX <= size + bs && prevY >= -bs && prevY <= size + bs);
                
                if (b.dir === 0) { isSolid = (bx + by <= size + bs); wasSolid = prevInAABB && (prevX + prevY <= size + bs); }
                else if (b.dir === 1) { isSolid = ((size - bx) + by <= size + bs); wasSolid = prevInAABB && ((size - prevX) + prevY <= size + bs); }
                else if (b.dir === 2) { isSolid = (bx + by >= size - bs); wasSolid = prevInAABB && (prevX + prevY >= size - bs); }
                else if (b.dir === 3) { isSolid = (bx + (size - by) <= size + bs); wasSolid = prevInAABB && (prevX + (size - prevY) <= size + bs); }
                
                if (isSolid) {
                  let reflected = false;
                  
                  const isRainbowPierce = (ballTypeRef.current === 'rainbow' && Math.random() < 0.20);
                  
                  if (isRainbowPierce) {
                    applyBallDamage(b, ball);
                    state.comboCount++;
                    addParticles(ball.x, ball.y, '#a855f7', 4, 'circle');
                    playSynthSound('hit', state.comboCount);
                  } else {
                    if (!wasSolid) {
                      reflected = true;
                      if (b.dir === 0) {
                         if (prevX < 0) ball.vx = -ball.vx;
                         else if (prevY < 0) ball.vy = -ball.vy;
                         else { const t = ball.vx; ball.vx = -ball.vy; ball.vy = -t; }
                      } else if (b.dir === 1) {
                         if (prevX > size) ball.vx = -ball.vx;
                         else if (prevY < 0) ball.vy = -ball.vy;
                         else { const t = ball.vx; ball.vx = ball.vy; ball.vy = t; }
                      } else if (b.dir === 2) {
                         if (prevX > size) ball.vx = -ball.vx;
                         else if (prevY > size) ball.vy = -ball.vy;
                         else { const t = ball.vx; ball.vx = -ball.vy; ball.vy = -t; }
                      } else if (b.dir === 3) {
                         if (prevX < 0) ball.vx = -ball.vx;
                         else if (prevY > size) ball.vy = -ball.vy;
                         else { const t = ball.vx; ball.vx = ball.vy; ball.vy = t; }
                      }
                    } else {
                      if (b.dir === 0) {
                         if (prevX < 0) ball.vx = Math.abs(ball.vx);
                         else if (prevY < 0) ball.vy = Math.abs(ball.vy);
                         else { ball.vx = Math.abs(ball.vx); ball.vy = Math.abs(ball.vy); }
                      } else if (b.dir === 1) {
                         if (prevX > size) ball.vx = -Math.abs(ball.vx);
                         else if (prevY < 0) ball.vy = Math.abs(ball.vy);
                         else { ball.vx = -Math.abs(ball.vx); ball.vy = Math.abs(ball.vy); }
                      } else if (b.dir === 2) {
                         if (prevX > size) ball.vx = -Math.abs(ball.vx);
                         else if (prevY > size) ball.vy = -Math.abs(ball.vy);
                         else { ball.vx = -Math.abs(ball.vx); ball.vy = -Math.abs(ball.vy); }
                      } else if (b.dir === 3) {
                         if (prevX < 0) ball.vx = Math.abs(ball.vx);
                         else if (prevY > size) ball.vy = -Math.abs(ball.vy);
                         else { ball.vx = Math.abs(ball.vx); ball.vy = -Math.abs(ball.vy); }
                      }
                    }
                    
                    if (reflected) {
                      applyBallDamage(b, ball);
                      state.comboCount++;
                      addParticles(ball.x, ball.y, '#9c4c34', 4);
                      playSynthSound('hit', state.comboCount);
                    }
                  }
                } else {
                  continue; 
                }
              }
              // Break check moved to global sweep to handle AOE
              break;
            }
          }

          // Check collisions with items (+ ball, lasers)
          for (let i = state.items.length - 1; i >= 0; i--) {
            const item = state.items[i];
            const dist = Math.hypot(ball.x - item.x, ball.y - item.y);
            if (dist < 10 + bs) {
              if (item.type === 'extra_ball') {
                item.collected = true;
                state.items.splice(i, 1);
                state.ballCount++;
                addParticles(item.x, item.y, '#10b981', 8);
                playSynthSound('item');
              } else if (item.type === 'laser') {
                // Clear row and col laser blast!
                state.items.splice(i, 1);
                addParticles(item.x, item.y, '#ef4444', 15);
                playSynthSound('laser');
                
                // Clear row: destroy all bricks in the same row
                for (let k = state.bricks.length - 1; k >= 0; k--) {
                  if (state.bricks[k].row === item.row) {
                    state.bricks[k].hp = 0;
                  }
                }
              } else if (item.type === 'lightning') {
                item.collected = true;
                state.items.splice(i, 1);
                playSynthSound('laser'); // Zap sound
                
                // Find 3 random bricks
                if (state.bricks.length > 0) {
                   const targets = [...state.bricks].sort(() => 0.5 - Math.random()).slice(0, 3);
                   targets.forEach(t => {
                      t.hp -= Math.ceil(state.level * 2);
                      if (!state.effects) state.effects = [];
                      state.effects.push({
                         type: 'lightning',
                         x1: item.x, y1: item.y,
                         x2: t.x + 25, y2: t.y + 25,
                         life: 1.0
                      });
                   });
                }
              } else if (item.type === 'multiplier_x2' || item.type === 'multiplier_x3') {
                const factor = item.type === 'multiplier_x2' ? 2 : 3;
                state.items.splice(i, 1);
                state.multiplier = factor;
                state.multiplierTurns = 2; // Active for 2 turns
                addParticles(item.x, item.y, '#f97316', 12);
                playSynthSound('item');
              } else if (item.type === 'bounce') {
                state.items.splice(i, 1);
                state.bounceFloorCharges = (state.bounceFloorCharges || 0) + 12;
                addParticles(item.x, item.y, '#06b6d4', 15);
                playSynthSound('item');
              } else if (item.type === 'scatter') {
                state.items.splice(i, 1);
                addParticles(item.x, item.y, '#a855f7', 15);
                playSynthSound('laser');
                
                const angle = Math.atan2(ball.vy, ball.vx);
                const speed = Math.hypot(ball.vx, ball.vy);
                
                ball.vx = Math.cos(angle - 0.25) * speed;
                ball.vy = Math.sin(angle - 0.25) * speed;
                
                state.balls.push({
                  x: ball.x,
                  y: ball.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  landed: false
                });
                state.balls.push({
                  x: ball.x,
                  y: ball.y,
                  vx: Math.cos(angle + 0.25) * speed,
                  vy: Math.sin(angle + 0.25) * speed,
                  landed: false
                });
              }
              break;
            }
          }
        }
      });
      
      if (state.effects) {
         for (let i = state.effects.length - 1; i >= 0; i--) {
            state.effects[i].life -= 0.05;
            if (state.effects[i].life <= 0) state.effects.splice(i, 1);
         }
      }
      
      // Check for dead bricks globally (useful for AOE damage from bombs and lightning)
      let explosionOccurred = false;
      for (let i = state.bricks.length - 1; i >= 0; i--) {
        const b = state.bricks[i];
        if (b.hp <= 0) {
           state.bricks.splice(i, 1);
           addParticles(b.x + 25, b.y + 25, brickColorRef.current, 10, 'shatter');
           if (!explosionOccurred) { playSynthSound('break'); }
           
           if (b.isBomb) {
               explosionOccurred = true;
               state.shakeTimer = 300;
               state.shakeMagnitude = 15;
               playSynthSound('laser');
               addParticles(b.x + 25, b.y + 25, '#ef4444', 30, 'circle');
               state.bricks.forEach(nb => {
                  const dist = Math.hypot(nb.x - b.x, nb.y - b.y);
                  if (dist < 120 && nb !== b) nb.hp -= Math.ceil(state.level * 1.5);
               });
           } else if (b.isDouble && !explosionOccurred) {
               state.shakeTimer = 150;
               state.shakeMagnitude = 6;
           }
        }
      }



      // Check if turn is completed (all balls returned)
      if (state.status === 'shooting') {
        state.shootingTicks = (state.shootingTicks || 0) + 1;
        // Safety timeout: If turn takes more than 25 seconds (approx 1500 frames), force end it
        if (state.shootingTicks > 1500) {
          state.balls.forEach(b => {
            b.landed = true;
            b.vx = 0;
            b.vy = 0;
          });
          state.landedCount = state.balls.length;
          state.ballsToLaunch = 0;
          state.shootingTicks = 0;
        }
      } else {
        state.shootingTicks = 0;
      }

      if (state.status === 'shooting' && state.ballsToLaunch === 0 && state.balls.length > 0 && state.landedCount === state.balls.length) {
        state.status = 'aiming';
        state.comboCount = 0;
        state.bounceFloorCharges = 0;
        state.level++;
        setScore(state.level);
        
        // Decrement multiplier turns if active
        if (state.multiplierTurns > 0) {
          state.multiplierTurns--;
          if (state.multiplierTurns === 0) {
            state.multiplier = 1;
          }
        }
        setBallCount(state.ballCount * state.multiplier);
        
        if (state.level > highScore) {
          setHighScore(state.level);
          localStorage.setItem('pos_bbtan_highscore', state.level.toString());
        }
        
        state.shooterX = state.firstLandedX || 230;
        state.firstLandedX = null;
        state.balls = [];
        state.landedCount = 0;
        state.shooterY = 765 - 32;
        
        // Spawn next row
        spawnRow(state);
        
        // Save state
        localStorage.setItem('pos_bbtan_state', JSON.stringify({
           level: state.level,
           ballCount: state.ballCount,
           bricks: state.bricks,
           items: state.items,
           shooterX: state.shooterX
        }));
        setHasSavedGame(true);
      }
    };

    const draw = () => {
      const state = stateRef.current;
      const dpr = canvas.width / 460;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, 460, 765);
      
      // Draw Danger Line
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(4, 710);
      ctx.lineTo(456, 710);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Bouncy Floor
      if (state.bounceFloorCharges > 0) {
        ctx.save();
        ctx.shadowBlur = 15; ctx.shadowColor = '#06b6d4';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(10, 710);
        ctx.lineTo(450, 710);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#06b6d4';
        ctx.font = '900 11px Consolas, Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`BOUNCE SHIELD: ${state.bounceFloorCharges}`, 230, 702);
        ctx.restore();
      }

      // Draw bricks
      state.bricks.forEach(b => {
        ctx.save();
        const w = b.w || 55;
        const h = b.h || 55;
        
        if (b.type === 'square') {
          ctx.fillStyle = brickColorRef.current;
          ctx.beginPath();
          ctx.rect(b.x + 2, b.y + 2, w - 4, h - 4);
          ctx.fill();
        } else if (b.type === 'bomb') {
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.rect(b.x + 2, b.y + 2, w - 4, h - 4);
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x + 2, b.y + 2, w - 4, h - 4);
          
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(b.x + w/2, b.y + h/2, (w/5) + Math.sin(Date.now() / 150) * 2, 0, Math.PI*2);
          ctx.fill();
        } else if (b.type === 'boss') {
          ctx.fillStyle = '#7f1d1d';
          ctx.beginPath();
          ctx.rect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
          ctx.fill();
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 4;
          ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
          
          ctx.fillStyle = '#fee2e2';
          ctx.beginPath();
          ctx.arc(b.x + b.w*0.3, b.y + b.h*0.3, b.w*0.06, 0, Math.PI*2);
          ctx.arc(b.x + b.w*0.7, b.y + b.h*0.3, b.w*0.06, 0, Math.PI*2);
          ctx.fill();
          
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.rect(b.x + b.w*0.2, b.y + b.h*0.7, b.w*0.6, h*0.08);
          ctx.fill();
        } else if (b.type === 'triangle') {
          ctx.lineJoin = 'round';
          ctx.beginPath();
          const padding = 2;
          if (b.dir === 0) {
            ctx.moveTo(b.x + padding, b.y + padding); ctx.lineTo(b.x + w - padding, b.y + padding); ctx.lineTo(b.x + padding, b.y + h - padding);
          } else if (b.dir === 1) {
            ctx.moveTo(b.x + padding, b.y + padding); ctx.lineTo(b.x + w - padding, b.y + padding); ctx.lineTo(b.x + w - padding, b.y + h - padding);
          } else if (b.dir === 2) {
            ctx.moveTo(b.x + w - padding, b.y + padding); ctx.lineTo(b.x + w - padding, b.y + h - padding); ctx.lineTo(b.x + padding, b.y + h - padding);
          } else {
            ctx.moveTo(b.x + padding, b.y + padding); ctx.lineTo(b.x + w - padding, b.y + h - padding); ctx.lineTo(b.x + padding, b.y + h - padding);
          }
          ctx.closePath();
          
          ctx.fillStyle = brickColorRef.current;
          ctx.fill();
        }
        
        // Draw brick HP text
        ctx.fillStyle = b.isDouble ? '#facc15' : '#ffffff';
        ctx.font = 'bold 14px Consolas, Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (b.type === 'triangle') {
          ctx.translate(b.x + w/2, b.y + h/2);
          if (b.dir === 0) {
            ctx.rotate(-Math.PI / 4);
            ctx.textBaseline = 'bottom';
            ctx.fillText(b.hp, 0, -2);
          } else if (b.dir === 1) {
            ctx.rotate(Math.PI / 4);
            ctx.textBaseline = 'bottom';
            ctx.fillText(b.hp, 0, -2);
          } else if (b.dir === 2) {
            ctx.rotate(-Math.PI / 4);
            ctx.textBaseline = 'top';
            ctx.fillText(b.hp, 0, 2);
          } else if (b.dir === 3) {
            ctx.rotate(Math.PI / 4);
            ctx.textBaseline = 'top';
            ctx.fillText(b.hp, 0, 2);
          }
        } else if (b.type === 'boss') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px Consolas, Monaco, monospace';
          ctx.fillText(b.hp, b.x + b.w/2, b.y + b.h/2);
        } else {
          ctx.fillText(b.hp, b.x + w/2, b.y + h/2);
        }
        
        ctx.restore();
      });

      // Draw items (+ ball, lasers)
      state.items.forEach(item => {
        ctx.save();
        if (item.type === 'extra_ball') {
          // Draw yellow/white circle with "+" sign
          const pulse = 12;
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.beginPath();
          ctx.arc(item.x, item.y, pulse + 6, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(item.x, item.y, pulse, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 14px Consolas, Monaco, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('+', item.x, item.y);
        } else if (item.type === 'multiplier_x2' || item.type === 'multiplier_x3') {
          const factor = item.type === 'multiplier_x2' ? 'x2' : 'x3';
          const size = 11;
          
          // Draw orange/gold glowing circle
          ctx.fillStyle = 'rgba(249, 115, 22, 0.18)';
          ctx.beginPath();
          ctx.arc(item.x, item.y, size + 6, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(item.x, item.y, size, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px Consolas, Monaco, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(factor, item.x, item.y);
        } else if (item.type === 'laser') {
          // Draw yellow laser core
          const size = 11;
          
          ctx.fillStyle = 'rgba(234, 179, 8, 0.18)';
          ctx.beginPath();
          ctx.arc(item.x, item.y, size + 5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(item.x, item.y, size, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(item.x, item.y, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'lightning') {
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.moveTo(item.x + 4, item.y - 10);
          ctx.lineTo(item.x - 6, item.y + 2);
          ctx.lineTo(item.x + 2, item.y + 2);
          ctx.lineTo(item.x - 4, item.y + 12);
          ctx.lineTo(item.x + 6, item.y);
          ctx.lineTo(item.x - 2, item.y);
          ctx.closePath();
          ctx.fill();
        } else if (item.type === 'bounce') {
          // Blue bounce icon
          ctx.shadowBlur = 8; ctx.shadowColor = '#06b6d4';
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath(); ctx.arc(item.x, item.y, 11, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(item.x - 6, item.y + 3);
          ctx.quadraticCurveTo(item.x, item.y - 5, item.x + 6, item.y + 3);
          ctx.stroke();
        } else if (item.type === 'scatter') {
          // Purple scatter icon
          ctx.shadowBlur = 8; ctx.shadowColor = '#a855f7';
          ctx.fillStyle = '#a855f7';
          ctx.beginPath(); ctx.arc(item.x, item.y, 11, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(item.x, item.y, 3, 0, Math.PI * 2);
          ctx.arc(item.x - 4, item.y - 3, 2, 0, Math.PI * 2);
          ctx.arc(item.x + 4, item.y - 3, 2, 0, Math.PI * 2);
          ctx.arc(item.x, item.y + 5, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      
      // Draw effects
      if (state.effects) {
         state.effects.forEach(e => {
            if (e.type === 'lightning') {
               ctx.save();
               ctx.strokeStyle = `rgba(168, 85, 247, ${e.life})`;
               ctx.lineWidth = 3;
               ctx.beginPath();
               ctx.moveTo(e.x1, e.y1);
               const steps = 5;
               for (let i = 1; i < steps; i++) {
                  const t = i / steps;
                  const lx = e.x1 + (e.x2 - e.x1) * t + (Math.random() - 0.5) * 20;
                  const ly = e.y1 + (e.y2 - e.y1) * t + (Math.random() - 0.5) * 20;
                  ctx.lineTo(lx, ly);
               }
               ctx.lineTo(e.x2, e.y2);
               ctx.stroke();
               ctx.restore();
            }
         });
      }

      // Draw aiming dotted line (Premium Tech Laser Beam)
      if (state.status === 'aiming' && state.isAiming) {
        ctx.save();
        
        let simX = state.shooterX;
        let simY = state.shooterY;
        let simVx = Math.cos(state.aimAngle);
        let simVy = Math.sin(state.aimAngle);
        
        const path = [{x: simX, y: simY}];
        let dist = 0;
        const maxDist = 900;
        
        while (dist < maxDist) {
           const step = 5;
           simX += simVx * step;
           simY += simVy * step;
           dist += step;

           let bounced = false;
           if (simX <= 8) { simX = 8; simVx = -simVx; bounced = true; }
           else if (simX >= 452) { simX = 452; simVx = -simVx; bounced = true; }
           if (simY <= 40) { simY = 40; simVy = -simVy; bounced = true; }
           
           let hitBrick = false;
           for (const b of state.bricks) {
              const size = 50;
              if (simX + 4 >= b.x && simX - 4 <= b.x + size &&
                  simY + 4 >= b.y && simY - 4 <= b.y + size) {
                  hitBrick = true;
                  break;
              }
           }

           if (bounced || hitBrick) {
              path.push({x: simX, y: simY});
           }
           if (hitBrick) break;
        }
        
        if (dist >= maxDist && (path.length === 1 || path[path.length - 1].x !== simX || path[path.length - 1].y !== simY)) {
           path.push({x: simX, y: simY});
        }

        // 1. Draw elegant thin line
        ctx.save();
        ctx.strokeStyle = aimColorRef.current;
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = -(Date.now() / 20 % 10); // Animate dashes
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 2. Draw minimalist terminal crosshair
        const targetX = path[path.length - 1].x;
        const targetY = path[path.length - 1].y;
        
        ctx.fillStyle = aimColorRef.current;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = aimColorRef.current;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 9 + Math.sin(Date.now() / 150) * 1.5, 0, Math.PI * 2); 
        ctx.stroke();
        
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(targetX - 14, targetY); ctx.lineTo(targetX + 14, targetY);
        ctx.moveTo(targetX, targetY - 14); ctx.lineTo(targetX, targetY + 14);
        ctx.stroke();

        ctx.restore();
        ctx.restore();
      }

      // Draw balls
      state.balls.forEach((ball, idx) => {
        if (ball.landed) return;
        ctx.save();
        
        let currentBallColor = ballColorRef.current;
        if (ballTypeRef.current === 'rainbow') {
          const hue = (Date.now() / 15 + idx * 8) % 360;
          currentBallColor = `hsl(${hue}, 95%, 60%)`;
        }

        // Draw Ghost Trail
        if (ballTypeRef.current === 'ghost' && ball.trail) {
          ball.trail.forEach((pos, trailIdx) => {
            const alpha = ((trailIdx + 1) / (ball.trail.length + 1)) * 0.35;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = currentBallColor;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, ballSizeRef.current * 0.85, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
        }

        // Draw Fire Aura Glow
        if (ballTypeRef.current === 'aura') {
          const pulse = ballSizeRef.current * (1.6 + Math.sin(Date.now() / 80) * 0.2);
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#f97316';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ef4444';
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Draw Ball Core
        if (ballTypeRef.current === 'star') {
          ctx.fillStyle = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#fbbf24';
          ctx.translate(ball.x, ball.y);
          ctx.rotate(Date.now() / 200 + idx * 0.2);
          ctx.beginPath();
          const rOuter = ballSizeRef.current * 1.35;
          const rInner = ballSizeRef.current * 0.6;
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * rOuter, -Math.sin((18 + i * 72) * Math.PI / 180) * rOuter);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * rInner, -Math.sin((54 + i * 72) * Math.PI / 180) * rInner);
          }
          ctx.closePath();
          ctx.fill();
        } else if (ballTypeRef.current === 'soccer') {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ballSizeRef.current, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ballSizeRef.current * 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalAlpha = 0.25;
          ctx.fillStyle = currentBallColor;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ballSizeRef.current * 2.0, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = currentBallColor;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ballSizeRef.current, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      });

      // Draw shooter position at the bottom
      ctx.save();
      if (state.status === 'aiming' || state.status === 'idle') {
        let previewColor = ballColorRef.current;
        if (ballTypeRef.current === 'rainbow') {
          const hue = (Date.now() / 15) % 360;
          previewColor = `hsl(${hue}, 95%, 60%)`;
        }

        // Draw Ball Bearer (Bệ đỡ bi dạng Retro Dot)
        ctx.save();
        ctx.fillStyle = previewColor;
        ctx.shadowBlur = 8;
        ctx.shadowColor = previewColor;
        
        const dots = [
          // Left wing
          { dx: -ballSizeRef.current - 5, dy: 1 },
          { dx: -ballSizeRef.current - 3, dy: 5 },
          // Bottom cradle curve
          { dx: -ballSizeRef.current + 1, dy: 9 },
          { dx: 0, dy: ballSizeRef.current + 6 },
          { dx: ballSizeRef.current - 1, dy: 9 },
          // Right wing
          { dx: ballSizeRef.current + 3, dy: 5 },
          { dx: ballSizeRef.current + 5, dy: 1 },
          // Stem column
          { dx: -4, dy: ballSizeRef.current + 11 },
          { dx: 0, dy: ballSizeRef.current + 11 },
          { dx: 4, dy: ballSizeRef.current + 11 },
          // Flat base stand
          { dx: -8, dy: ballSizeRef.current + 15 },
          { dx: -4, dy: ballSizeRef.current + 15 },
          { dx: 0, dy: ballSizeRef.current + 15 },
          { dx: 4, dy: ballSizeRef.current + 15 },
          { dx: 8, dy: ballSizeRef.current + 15 }
        ];

        const dotSize = Math.max(3.5, ballSizeRef.current * 0.45);
        dots.forEach(d => {
          ctx.beginPath();
          ctx.rect(state.shooterX + d.dx - dotSize/2, state.shooterY + d.dy - dotSize/2, dotSize, dotSize);
          ctx.fill();
        });
        ctx.restore();

        if (ballTypeRef.current === 'star') {
          ctx.fillStyle = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#fbbf24';
          ctx.translate(state.shooterX, state.shooterY);
          ctx.rotate(Date.now() / 200);
          ctx.beginPath();
          const rOuter = ballSizeRef.current * 1.35;
          const rInner = ballSizeRef.current * 0.6;
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * rOuter, -Math.sin((18 + i * 72) * Math.PI / 180) * rOuter);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * rInner, -Math.sin((54 + i * 72) * Math.PI / 180) * rInner);
          }
          ctx.closePath();
          ctx.fill();
        } else if (ballTypeRef.current === 'soccer') {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(state.shooterX, state.shooterY, ballSizeRef.current, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(state.shooterX, state.shooterY, ballSizeRef.current * 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalAlpha = 0.25;
          ctx.fillStyle = previewColor;
          ctx.beginPath();
          ctx.arc(state.shooterX, state.shooterY, ballSizeRef.current * 2.0, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = previewColor;
          ctx.beginPath();
          ctx.arc(state.shooterX, state.shooterY, ballSizeRef.current, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(state.shooterX, state.shooterY, ballSizeRef.current + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();

      // Draw particles
      state.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        
        if (p.type === 'shatter') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.beginPath();
          ctx.moveTo(-p.size, -p.size);
          ctx.lineTo(p.size, -p.size*0.5);
          ctx.lineTo(p.size*0.5, p.size);
          ctx.lineTo(-p.size*0.8, p.size*0.8);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          if (p.type === 'star') {
            ctx.moveTo(p.x, p.y - p.size);
            ctx.lineTo(p.x + p.size/3, p.y - p.size/3);
            ctx.lineTo(p.x + p.size, p.y);
            ctx.lineTo(p.x + p.size/3, p.y + p.size/3);
            ctx.lineTo(p.x, p.y + p.size);
            ctx.lineTo(p.x - p.size/3, p.y + p.size/3);
            ctx.lineTo(p.x - p.size, p.y);
            ctx.lineTo(p.x - p.size/3, p.y - p.size/3);
          } else {
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          }
          ctx.fill();
        }
        ctx.restore();
      });
    };

    const loop = () => {
      if (!isLooping) return;
      update();
      draw();
      
      if (needsAnimation()) {
        animationFrameId = requestAnimationFrame(loop);
      } else {
        isLooping = false;
        animationFrameId = null;
      }
    };
    
    // Draw initial static frame
    draw();
    if (needsAnimation()) {
      startLoop();
    }
    
    return () => {
      isLooping = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      startLoopRef.current = null;
    };
  }, [status, playSynthSound]);

  // Mouse / Touch Aiming listeners
  const handleMouseDown = (e) => {
    if (status !== 'playing') return;
    const state = stateRef.current;
    if (state.status !== 'aiming') return;
    
    state.isAiming = true;
    updateAimAngle(e);
    startLoopRef.current && startLoopRef.current();
  };

  const handleMouseMove = (e) => {
    const state = stateRef.current;
    if (state.status !== 'aiming' || !state.isAiming) return;
    updateAimAngle(e);
    startLoopRef.current && startLoopRef.current();
  };

  const handleMouseUp = () => {
    const state = stateRef.current;
    if (state.status !== 'aiming' || !state.isAiming) return;
    
    state.isAiming = false;
    
    // Launch all balls
    state.status = 'shooting';
    state.ballsToLaunch = state.ballCount * state.multiplier;
    state.launchTimer = 0;
    state.launchPos = { x: state.shooterX, y: state.shooterY };
    startLoopRef.current && startLoopRef.current();
  };

  const updateAimAngle = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const state = stateRef.current;
    
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    
    const x = (clientX - rect.left) * (460 / rect.width);
    const y = (clientY - rect.top) * (765 / rect.height);
    
    state.mousePos = { x, y };
    
    // Calculate angle from shooter to pointer
    const dx = x - state.shooterX;
    const dy = y - state.shooterY;
    
    let angle = Math.atan2(dy, dx);
    
    // Constraint shooter angles so player cannot aim straight sideways or down
    if (angle > -0.15) angle = -0.15;
    if (angle < -Math.PI + 0.15) angle = -Math.PI + 0.15;
    
    state.aimAngle = angle;
  };

  return (
    <div className="w-full h-full max-h-full max-w-5xl mx-auto flex flex-col md:flex-row items-stretch justify-center gap-6 px-2 py-1 md:px-6 md:py-2 select-none overflow-hidden">
      
      {/* Game board wrapper with glowing premium glassmorphism */}
      <div 
        className={`relative rounded-none overflow-hidden bg-gradient-to-b from-white/[0.03] to-white/[0.01] border-2 border-yellow-500/25 dark:border-yellow-500/15 shadow-[0_0_40px_rgba(234,179,8,0.18)] ring-1 ring-white/10 backdrop-blur-md mx-auto h-full min-w-0 min-h-0 shrink`}
        style={{ aspectRatio: '460/765' }}
      >
        <canvas
          ref={canvasRef}
          width={1840}
          height={3060}
          className="bg-transparent block cursor-crosshair absolute inset-0 w-full h-full object-fill"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        />

        {/* Overlay screens */}
        {status === 'idle' && (
          <div className="absolute inset-0 bg-transparent flex flex-col items-center justify-center text-center p-4 z-50">
            <Gamepad2 className="text-primary mb-3" size={56} />
            <h3 className="text-2xl font-black uppercase text-primary tracking-widest drop-shadow-[0_0_15px_var(--color-primary)]">BBTAN PREMIUM</h3>
            <p className="text-sm text-slate-300 max-w-[240px] mt-2 mb-6 font-bold">Kéo để ngắm, thả ra để bắn bóng phá gạch gỗ cổ điển.</p>
            <div className="flex flex-col gap-4 w-full max-w-[240px]">
              {hasSavedGame && (
                <button
                  onClick={() => initGame(true)}
                  className="w-full px-6 py-4 bg-blue-500 text-white font-black uppercase tracking-widest text-sm rounded-none border-2 border-blue-800 border-b-[6px] active:border-b-2 active:translate-y-[4px] hover:bg-blue-400 transition-all"
                >
                  TIẾP TỤC CHƠI
                </button>
              )}
              <button
                onClick={() => initGame(false)}
                className="w-full px-6 py-4 bg-[#8b5a2b] text-white font-black uppercase tracking-widest text-sm rounded-none border-2 border-[#5c3a18] border-b-[6px] active:border-b-2 active:translate-y-[4px] hover:bg-[#a06d38] transition-all"
              >
                {hasSavedGame ? "CHƠI LẠI TỪ ĐẦU" : "BẮT ĐẦU CHƠI"}
              </button>
            </div>
          </div>
        )}

        {status === 'gameover' && (
          <div className="absolute inset-0 bg-transparent flex flex-col items-center justify-center text-center p-4 z-50">
            <AlertTriangle className="text-red-500 mb-3 animate-pulse" size={56} />
            <h3 className="text-3xl font-black uppercase text-red-500 tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">THUA CUỘC</h3>
            <p className="text-sm text-slate-300 font-bold uppercase tracking-wider mt-2 mb-6">Cấp độ tối đa đạt được: <span className="text-yellow-500 text-2xl font-black ml-1">{score}</span></p>
            <div className="flex flex-col gap-4 w-full max-w-[240px]">
              <button
                onClick={() => initGame(false)}
                className="w-full px-6 py-4 bg-[#8b5a2b] text-white font-black uppercase tracking-widest text-sm rounded-none border-2 border-[#5c3a18] border-b-[6px] active:border-b-2 active:translate-y-[4px] hover:bg-[#a06d38] transition-all"
              >
                CHƠI LẠI NGAY
              </button>
            </div>
          </div>
        )}

        {status === 'revive_prompt' && (
          <div className="absolute inset-0 bg-transparent flex flex-col items-center justify-center text-center p-4 z-50">
            <AlertTriangle className="text-yellow-500 mb-3 animate-pulse" size={56} />
            <h3 className="text-2xl font-black uppercase text-yellow-500 tracking-widest drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">HỒI SINH?</h3>
            <p className="text-sm text-slate-300 font-bold uppercase tracking-wider mt-2 mb-6 max-w-[240px] leading-relaxed">Bạn có muốn dùng quyền hồi sinh duy nhất?</p>
            <div className="flex flex-col gap-4 w-full max-w-[240px]">
              <button
                onClick={() => handleRevive(true)}
                className="w-full px-6 py-4 bg-blue-500 text-white font-black uppercase tracking-widest text-sm rounded-none border-2 border-blue-800 border-b-[6px] active:border-b-2 active:translate-y-[4px] hover:bg-blue-400 transition-all"
              >
                ĐỒNG Ý (CÓ)
              </button>
              <button
                onClick={() => handleRevive(false)}
                className="w-full px-6 py-4 bg-transparent border-2 border-slate-500 text-slate-300 hover:text-white font-black uppercase tracking-widest text-sm rounded-none hover:scale-105 active:scale-95 transition-all"
              >
                BỎ QUA (KHÔNG)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info panels side section - Premium UI Controls */}
      <div className="w-full md:w-64 flex flex-col gap-3 self-stretch justify-start h-full max-h-full overflow-hidden">
        <div className="relative overflow-y-auto bg-transparent border border-white/15 dark:border-white/5 p-4 rounded-none flex flex-col gap-3 shadow-none ring-1 ring-white/10 flex-1 min-h-0">
          
          {/* Game Mode Selector */}
          <div className="group w-full flex flex-col bg-transparent rounded-none p-3 border border-yellow-500/25 hover:border-yellow-400/50 transition-all duration-300 cursor-default">
            <div className="text-[11px] text-yellow-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
              <Gamepad2 size={16} /> Chế độ chơi
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setGameMode('classic')}
                className={`flex-1 py-1.5 text-xs font-black uppercase tracking-wider rounded-none border transition-all ${
                  gameMode === 'classic'
                    ? 'bg-yellow-500 text-black border-yellow-500'
                    : 'bg-transparent text-slate-400 border-white/20 hover:text-white hover:border-white/40'
                }`}
              >
                Cổ điển
              </button>
              <button
                onClick={() => setGameMode('advanced')}
                className={`flex-1 py-1.5 text-xs font-black uppercase tracking-wider rounded-none border transition-all ${
                  gameMode === 'advanced'
                    ? 'bg-yellow-500 text-black border-yellow-500'
                    : 'bg-transparent text-slate-400 border-white/20 hover:text-white hover:border-white/40'
                }`}
              >
                Nâng cao
              </button>
            </div>
          </div>

          <div className="group w-full flex justify-between items-center bg-transparent rounded-none p-3 border border-yellow-500/25 hover:border-yellow-400/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-default">
            <div className="text-[11px] text-yellow-500 font-black uppercase tracking-widest flex items-center gap-2">
              <Trophy size={16} className="text-yellow-500 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" /> Kỷ lục
            </div>
            <div className="text-3xl font-black text-yellow-500 drop-shadow-[0_0_12px_rgba(234,179,8,0.45)]">{highScore}</div>
          </div>
          
          <div className="group w-full flex justify-between items-center bg-transparent rounded-none p-3 border border-white/20 hover:border-white/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-default">
            <div className="text-[11px] text-slate-300 font-black uppercase tracking-widest flex items-center gap-2">
              <Gamepad2 size={16} className="text-white transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" /> Cấp độ
            </div>
            <div className="text-3xl font-black text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]">{score}</div>
          </div>

          <div className="group w-full flex justify-between items-center bg-transparent rounded-none p-3 border border-yellow-500/25 hover:border-yellow-400/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-default">
            <div className="text-[11px] text-yellow-400 font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block transition-transform duration-300 group-hover:scale-125" /> Số bóng
            </div>
            <div className="text-3xl font-black text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.45)]">{ballCount}</div>
          </div>

          <div className="group w-full flex flex-col bg-transparent rounded-none p-3 border border-white/20 hover:border-white/40 transition-all duration-300 cursor-default">
            <div className="flex justify-between items-center mb-1">
               <div className="text-[11px] text-slate-300 font-black uppercase tracking-widest">Tốc độ x{gameSpeed}</div>
            </div>
            <input 
              type="range" 
              min="1" 
              max="5" 
              step="0.5" 
              value={gameSpeed} 
              onChange={(e) => setGameSpeed(parseFloat(e.target.value))} 
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500" 
            />
          </div>

          <div className="group w-full flex flex-col bg-transparent rounded-none p-3 border border-white/20 hover:border-white/40 transition-all duration-300 cursor-default">
            <div className="flex justify-between items-center mb-1">
               <div className="text-[11px] text-slate-300 font-black uppercase tracking-widest">Cỡ bóng {ballSize}px</div>
               <input 
                 type="color" 
                 value={ballColor} 
                 onChange={(e) => setBallColor(e.target.value)} 
                 className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
                 title="Chọn màu bóng"
               />
            </div>
            <input 
              type="range" 
              min="2" 
              max="12" 
              step="1" 
              value={ballSize} 
              onChange={(e) => setBallSize(parseInt(e.target.value))} 
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" 
            />
          </div>

          <div className="group w-full flex flex-col bg-transparent rounded-none p-3 border border-white/20 hover:border-white/40 transition-all duration-300 cursor-default">
             <div className="text-[11px] text-slate-300 font-black uppercase tracking-widest mb-1.5">Hiệu ứng bi</div>
             <select
               value={ballType}
               onChange={(e) => setBallType(e.target.value)}
               className="w-full bg-slate-900 border border-white/20 p-2 text-xs font-black uppercase tracking-widest text-slate-350 outline-none focus:border-cyan-500 rounded-none cursor-pointer mb-2"
             >
               <option value="solid">Neon Basic (Đơn Sắc)</option>
               <option value="star">Gold Star (Ngôi Sao)</option>
               <option value="aura">Fire Aura (Lửa Neon)</option>
               <option value="rainbow">Rainbow (Cầu Vồng)</option>
               <option value="ghost">Ghost Trail (Phân Thân)</option>
               <option value="soccer">Soccer (Bóng Đá)</option>
             </select>
             
             {/* Skill Description */}
             <div className="text-[10px] leading-relaxed font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/30 border border-cyan-800/30 p-2 rounded-none">
               {ballType === 'star' && '⭐ Chí Mạng: 25% cơ hội gây 2 HP sát thương.'}
               {ballType === 'aura' && '🔥 Nổ Lan: 15% cơ hội gây 1 HP sát thương các gạch lân cận.'}
               {ballType === 'rainbow' && '🌈 Xuyên Thấu: 20% cơ hội xuyên qua gạch không bị nẩy lại.'}
               {ballType === 'ghost' && '👻 Bóng Ma: 15% cơ hội phân thân gây thêm 1 HP sát thương.'}
               {ballType === 'soccer' && '⚽ Sút Mạnh: 30% cơ hội gây 2 HP & rung màn hình.'}
               {ballType === 'solid' && '✨ Neon Đơn Sắc: Bi cơ bản không có kĩ năng đặc biệt.'}
             </div>
          </div>

          <div className="group w-full flex justify-between items-center bg-transparent rounded-none p-3 border border-white/20 hover:border-white/40 transition-all duration-300 cursor-default">
             <div className="text-[11px] text-slate-300 font-black uppercase tracking-widest">Màu gạch</div>
             <input 
               type="color" 
               value={brickColor} 
               onChange={(e) => setBrickColor(e.target.value)} 
               className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
               title="Chọn màu gạch"
             />
          </div>

          <div className="group w-full flex justify-between items-center bg-transparent rounded-none p-3 border border-white/20 hover:border-white/40 transition-all duration-300 cursor-default mt-1">
             <div className="text-[11px] text-slate-300 font-black uppercase tracking-widest">Đường ngắm</div>
             <input 
               type="color" 
               value={aimColor} 
               onChange={(e) => setAimColor(e.target.value)} 
               className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
               title="Chọn màu đường ngắm"
             />
          </div>

        </div>

        <button
          onClick={() => initGame(false)}
          className="group w-full py-3 bg-transparent text-yellow-500 hover:bg-yellow-500 hover:text-black font-black uppercase tracking-widest text-xs rounded-none transition-all duration-300 flex items-center justify-center gap-2 mt-auto border border-yellow-500"
        >
          <RefreshCw size={16} className="transition-transform duration-700 group-hover:rotate-180" /> Bắt đầu lại
        </button>
      </div>

    </div>
  );
}

export default function Gaming() {
  const [currentGame, setCurrentGame] = useState('sudoku'); // sudoku, tetris, bbtan
  const [gameState, setGameState] = useState('menu'); // menu, playing, won, lost
  const [difficulty, setDifficulty] = useState('hard'); // hard, very-hard
  const [board, setBoard] = useState([]);
  const [solution, setSolution] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  
  // Highlighting specific number (e.g. when cell containing a number or numpad is clicked)
  const [selectedNumber, setSelectedNumber] = useState(null);

  const [notesMode, setNotesMode] = useState(false);
  const [errors, setErrors] = useState(0);
  const [timer, setTimer] = useState(0);
  
  // History stack for Undo
  const [history, setHistory] = useState([]);
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  
  const timerRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const triggerSound = (type) => {
    if (soundEnabled) playSound(type);
  };

  // Start new game
  const startNewGame = useCallback((selectedDiff) => {
    triggerSound('success');
    const solved = generateSolvedBoard();
    const puzzle = createPuzzle(solved, selectedDiff);
    setSolution(solved);
    setBoard(puzzle);
    setDifficulty(selectedDiff);
    setErrors(0);
    setTimer(0);
    setSelectedCell(null);
    setSelectedNumber(null);
    setNotesMode(false);
    setHistory([]);
    setGameState('playing');
    setShowNewGameModal(false);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  }, [soundEnabled]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Restore game state on mount
  useEffect(() => {
    const saved = localStorage.getItem('pos_sudoku_save_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDifficulty(parsed.difficulty || 'hard');
        setBoard(parsed.board || []);
        setSolution(parsed.solution || []);
        setSelectedCell(parsed.selectedCell || null);
        setSelectedNumber(parsed.selectedNumber || null);
        setNotesMode(parsed.notesMode || false);
        setErrors(parsed.errors || 0);
        setTimer(parsed.timer || 0);
        setHistory(parsed.history || []);
        setGameState('playing');

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimer(prev => prev + 1);
        }, 1000);
      } catch (e) {
        console.error('Failed to restore Sudoku save state:', e);
      }
    }
  }, []);

  // Save game state on updates
  useEffect(() => {
    if (gameState === 'playing') {
      const stateToSave = {
        difficulty,
        board,
        solution,
        selectedCell,
        selectedNumber,
        notesMode,
        errors,
        timer,
        history
      };
      localStorage.setItem('pos_sudoku_save_state', JSON.stringify(stateToSave));
    } else if (gameState === 'menu' || gameState === 'won' || gameState === 'lost') {
      localStorage.removeItem('pos_sudoku_save_state');
    }
  }, [gameState, difficulty, board, solution, selectedCell, selectedNumber, notesMode, errors, timer, history]);

  // Format time
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // Push current board to history before modification
  const pushToHistory = (currentBoard) => {
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(currentBoard))]);
  };

  // Check victory condition (all cells filled correctly)
  const checkVictory = (currentBoard) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c].value !== solution[r][c]) {
          return false;
        }
      }
    }
    return true;
  };

  // Auto clean notes containing 'num' in corresponding row, col, and block
  const autoCleanNotes = (newBoard, row, col, num) => {
    const blockRowStart = Math.floor(row / 3) * 3;
    const blockColStart = Math.floor(col / 3) * 3;

    for (let i = 0; i < 9; i++) {
      // Clean row
      if (newBoard[row][i].value === 0) {
        newBoard[row][i].notes = newBoard[row][i].notes.filter(n => n !== num);
      }
      // Clean col
      if (newBoard[i][col].value === 0) {
        newBoard[i][col].notes = newBoard[i][col].notes.filter(n => n !== num);
      }
      // Clean 3x3 block
      const r = blockRowStart + Math.floor(i / 3);
      const c = blockColStart + (i % 3);
      if (newBoard[r][c].value === 0) {
        newBoard[r][c].notes = newBoard[r][c].notes.filter(n => n !== num);
      }
    }
  };

  // Input value handlers
  const handleCellInput = useCallback((num) => {
    if (gameState !== 'playing') return;

    if (selectedCell) {
      const { row, col } = selectedCell;
      const cell = board[row][col];
      
      // Original hints or resolved hints cannot be modified
      if (cell.isOriginal || cell.isHint) return;

      pushToHistory(board);

      if (notesMode) {
        triggerSound('note');
        const newBoard = board.map((r, ri) => r.map((c, ci) => {
          if (ri === row && ci === col) {
            const notes = c.notes.includes(num)
              ? c.notes.filter(n => n !== num)
              : [...c.notes, num].sort();
            return { ...c, value: 0, notes }; // writing note clears any cell value
          }
          return c;
        }));
        setBoard(newBoard);
      } else {
        const correctVal = solution[row][col];
        const isCorrect = num === correctVal;

        if (isCorrect) {
          triggerSound('click');
          setSelectedNumber(num); // Highlight this correct number across the board
        } else {
          triggerSound('error');
          setErrors(prev => {
            const newErrors = prev + 1;
            if (newErrors >= 3) {
              setGameState('lost');
              if (timerRef.current) clearInterval(timerRef.current);
            }
            return newErrors;
          });
        }

        // We allow typing incorrect numbers, which will show as red
        const newBoard = board.map((r, ri) => r.map((c, ci) => {
          if (ri === row && ci === col) {
            return { ...c, value: num, notes: [] };
          }
          return c;
        }));

        // If correct, clean corresponding notes
        if (isCorrect) {
          autoCleanNotes(newBoard, row, col, num);
        }

        setBoard(newBoard);

        if (isCorrect && checkVictory(newBoard)) {
          triggerSound('success');
          setGameState('won');
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }
    } else {
      // If no cell is selected, clicking a keypad number toggles the global highlight of that number
      triggerSound('click');
      setSelectedNumber(prev => (prev === num ? null : num));
    }
  }, [board, selectedCell, notesMode, solution, gameState]);

  // Handle cell erase
  const handleErase = useCallback(() => {
    if (gameState !== 'playing' || !selectedCell) return;
    const { row, col } = selectedCell;
    const cell = board[row][col];
    if (cell.isOriginal || cell.isHint) return;

    pushToHistory(board);
    triggerSound('erase');
    const newBoard = board.map((r, ri) => r.map((c, ci) => {
      if (ri === row && ci === col) {
        return { ...c, value: 0, notes: [] };
      }
      return c;
    }));
    setBoard(newBoard);
  }, [board, selectedCell, gameState]);

  // Undo feature
  const handleUndo = () => {
    if (gameState !== 'playing' || history.length === 0) return;
    triggerSound('erase');
    const prevBoard = history[history.length - 1];
    setBoard(prevBoard);
    setHistory(prev => prev.slice(0, -1));
  };

  // Hint feature
  const handleHint = () => {
    if (gameState !== 'playing' || !selectedCell) return;
    const { row, col } = selectedCell;
    const cell = board[row][col];
    if (cell.isOriginal || cell.isHint || cell.value === solution[row][col]) return;

    pushToHistory(board);
    triggerSound('hint');

    const correctVal = solution[row][col];
    const newBoard = board.map((r, ri) => r.map((c, ci) => {
      if (ri === row && ci === col) {
        return { ...c, value: correctVal, isHint: true, notes: [] };
      }
      return c;
    }));

    autoCleanNotes(newBoard, row, col, correctVal);
    setBoard(newBoard);
    setSelectedNumber(correctVal);

    if (checkVictory(newBoard)) {
      triggerSound('success');
      setGameState('won');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;

      if (e.key >= '1' && e.key <= '9') {
        handleCellInput(parseInt(e.key));
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        handleErase();
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        setNotesMode(prev => !prev);
        triggerSound('click');
        return;
      }
      if (e.key === 'u' || e.key === 'U' || (e.ctrlKey && e.key === 'z')) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        handleHint();
        return;
      }

      if (selectedCell) {
        let { row, col } = selectedCell;
        switch (e.key) {
          case 'ArrowUp':
            row = row > 0 ? row - 1 : 8;
            break;
          case 'ArrowDown':
            row = row < 8 ? row + 1 : 0;
            break;
          case 'ArrowLeft':
            col = col > 0 ? col - 1 : 8;
            break;
          case 'ArrowRight':
            col = col < 8 ? col + 1 : 0;
            break;
          default:
            return;
        }
        e.preventDefault();
        setSelectedCell({ row, col });
        triggerSound('click');

        // Also update highlight matching number if the newly selected cell has a value
        const cellValue = board[row][col]?.value;
        if (cellValue && cellValue !== 0) {
          setSelectedNumber(cellValue);
        } else {
          setSelectedNumber(null);
        }
      } else {
        setSelectedCell({ row: 0, col: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, selectedCell, handleCellInput, handleErase, history, board]);

  // Corner radius calculation to match grid container rounded borders
  const getCornerRadiusClass = (r, c) => {
    if (r === 0 && c === 0) return 'rounded-tl-[22px]';
    if (r === 0 && c === 8) return 'rounded-tr-[22px]';
    if (r === 8 && c === 0) return 'rounded-bl-[22px]';
    if (r === 8 && c === 8) return 'rounded-br-[22px]';
    return '';
  };

  // UI helper classes for highlighting row/col/box and identical numbers
  const getCellHighlightClass = (r, c) => {
    const currentVal = board[r][c]?.value;
    const isSameValue = selectedNumber && currentVal !== 0 && currentVal === selectedNumber;
    const corners = getCornerRadiusClass(r, c);

    if (selectedCell && selectedCell.row === r && selectedCell.col === c) {
      return `text-emerald-700 dark:text-emerald-250 font-black z-10 ${corners}`;
    }

    if (isSameValue) {
      // Highlight matching numbers across the board
      return `bg-emerald-500/25 dark:bg-emerald-500/35 text-emerald-600 dark:text-emerald-300 font-black ring-1 ring-emerald-500/30 ${corners}`;
    }

    let isUnderCrosshair = false;

    // 1. Crosshair from selectedCell
    if (selectedCell) {
      const sameRow = selectedCell.row === r;
      const sameCol = selectedCell.col === c;
      const sameBox = Math.floor(selectedCell.row / 3) === Math.floor(r / 3) &&
                      Math.floor(selectedCell.col / 3) === Math.floor(c / 3);

      if (sameRow || sameCol || sameBox) {
        isUnderCrosshair = true;
      }
    }

    // 2. Crosshair from any identical selected numbers (Scanning crosshairs)
    if (!isUnderCrosshair && selectedNumber) {
      for (let tr = 0; tr < 9; tr++) {
        for (let tc = 0; tc < 9; tc++) {
          if (board[tr][tc].value === selectedNumber) {
            const sameRow = tr === r;
            const sameCol = tc === c;
            const sameBox = Math.floor(tr / 3) === Math.floor(r / 3) &&
                            Math.floor(tc / 3) === Math.floor(c / 3);
            if (sameRow || sameCol || sameBox) {
              isUnderCrosshair = true;
              break;
            }
          }
        }
        if (isUnderCrosshair) break;
      }
    }

    if (isUnderCrosshair) {
      return `bg-transparent-panel0/10 dark:bg-transparent-panel0/15 text-slate-800 dark:text-slate-200 ${corners}`;
    }

    return `bg-transparent text-slate-800 dark:text-slate-200 hover:bg-transparent-panel0/10 ${corners}`;
  };

  // Compute remaining count for numbers 1 to 9
  const getRemainingCount = (num) => {
    if (!board || board.length === 0) return 9;
    let correctCount = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c].value === num && board[r][c].value === solution[r][c]) {
          correctCount++;
        }
      }
    }
    return Math.max(0, 9 - correctCount);
  };

  const handleCellClick = (r, c) => {
    triggerSound('click');
    setSelectedCell({ row: r, col: c });
    const cellValue = board[r][c]?.value;
    if (cellValue && cellValue !== 0) {
      setSelectedNumber(cellValue);
    } else {
      setSelectedNumber(null);
    }
  };

  return (
    <div className="pt-2 px-4 pb-4 w-full transition-colors duration-300 h-[calc(100vh-20px)] overflow-hidden flex flex-col font-sans relative select-none">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Title / Header Menu */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-2 relative z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-primary uppercase tracking-tight flex items-center gap-3 pt-2 pb-0.5 leading-relaxed">
            <Gamepad2 className="text-primary shrink-0" size={32} />
            KHU GIẢI TRÍ
          </h1>
          <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg tracking-tighter">LyangPOS by Lyang</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
                {currentGame === 'tetris'
                  ? "Xếp gạch không giới hạn với Tetris Infinite cổ điển"
                  : currentGame === 'bbtan'
                    ? "Bắn bóng phá gạch gỗ cổ điển BBTAN Premium"
                    : gameState === 'menu' 
                      ? "Thử thách trí tuệ với các câu đố Sudoku đỉnh cao" 
                      : `Đang giải câu đố Sudoku chế độ ${difficulty === 'master' ? 'Bậc thầy' : difficulty === 'very-hard' ? 'Rất khó' : 'Khó'}`}
              </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Game Switcher Tabs */}
          <div className="flex items-center border border-border rounded-2xl p-1 bg-transparent shrink-0">
            <button
              onClick={() => {
                triggerSound('click');
                setCurrentGame('sudoku');
              }}
              className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-xl transition-all ${
                currentGame === 'sudoku'
                  ? 'bg-primary text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-transparent-panel0/10'
              }`}
            >
              Sudoku
            </button>
            <button
              onClick={() => {
                triggerSound('click');
                setCurrentGame('tetris');
              }}
              className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-xl transition-all ${
                currentGame === 'tetris'
                  ? 'bg-primary text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-transparent-panel0/10'
              }`}
            >
              Tetris Infinite
            </button>
            <button
              onClick={() => {
                triggerSound('click');
                setCurrentGame('bbtan');
              }}
              className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-xl transition-all ${
                currentGame === 'bbtan'
                  ? 'bg-primary text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-transparent-panel0/10'
              }`}
            >
              BBTAN
            </button>
          </div>

          {currentGame === 'sudoku' && gameState !== 'menu' && (
            <m.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                triggerSound('erase');
                setGameState('menu');
                if (timerRef.current) clearInterval(timerRef.current);
              }}
              className="px-4 py-2 bg-transparent border-2 border-[#2d5016]/20 dark:border-[#4a7c59]/20 text-[#2d5016] dark:text-[#4a7c59] text-[10px] font-black uppercase rounded-2xl hover:bg-[#2d5016]/5 dark:hover:bg-[#4a7c59]/5 transition-all tracking-widest flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Quay lại
            </m.button>
          )}
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className="px-4 py-2 bg-[#2d5016] text-white dark:bg-emerald-600 text-[10px] font-black uppercase rounded-2xl hover:bg-[#4a7c59] dark:hover:bg-emerald-500 transition-all shadow-lg shadow-[#2d5016]/20 dark:shadow-emerald-500/20 tracking-widest"
          >
            Âm thanh: {soundEnabled ? 'Bật' : 'Tắt'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center w-full">
        {currentGame === 'tetris' ? (
          <TetrisInfinite soundEnabled={soundEnabled} />
        ) : currentGame === 'bbtan' ? (
          <BBTanGame soundEnabled={soundEnabled} />
        ) : (
          <AnimatePresence mode="wait">
          
          {/* MENU STATE */}
          {gameState === 'menu' && (
            <m.div
              key="menu"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-xl bg-transparent border border-border rounded-[2rem] p-8 md:p-10 shadow-none text-center flex flex-col items-center gap-6 relative overflow-hidden mt-4"
            >
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#2d5016] to-[#4a7c59] text-white shadow-xl shadow-[#2d5016]/10 animate-pulse">
              <Gamepad2 size={48} />
            </div>

            <div>
              <h2 className="text-3xl font-black uppercase tracking-widest text-[#2d5016] dark:text-[#4a7c59]">SUDOKU</h2>
              <p className="text-sm text-[#8b6f47] dark:text-[#d4a574]/70 mt-2 font-medium tracking-tight">
                Rèn luyện trí tuệ, rèn luyện tư duy logic theo chuẩn Sudoku.com.
              </p>
            </div>

            <div className="w-full flex flex-col gap-4">
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startNewGame('hard')}
                className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-[#2d5016] to-[#4a7c59] hover:from-[#37611b] hover:to-[#579068] text-white font-black uppercase tracking-widest shadow-lg shadow-[#2d5016]/15 flex items-center justify-center gap-3 text-base duration-300"
              >
                <Play size={20} fill="white" />
                Độ khó: KHÓ (Hard)
              </m.button>

              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startNewGame('very-hard')}
                className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-[#8b6f47] to-[#d4a574] hover:from-[#a08153] hover:to-[#e3b785] text-white font-black uppercase tracking-widest shadow-lg shadow-[#8b6f47]/15 flex items-center justify-center gap-3 text-base duration-300"
              >
                <Play size={20} fill="white" />
                Độ khó: RẤT KHÓ (Very Hard)
              </m.button>

              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startNewGame('master')}
                className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-[#9b1c1c] to-[#e02424] hover:from-[#b91c1c] hover:to-[#ef4444] text-white font-black uppercase tracking-widest shadow-lg shadow-rose-900/15 flex items-center justify-center gap-3 text-base duration-300"
              >
                <Play size={20} fill="white" />
                Độ khó: BẬC THẦY (Master)
              </m.button>
            </div>
          </m.div>
        )}

        {/* PLAYING STATE */}
        {gameState === 'playing' && (
          <m.div
            key="playing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-full flex flex-col lg:flex-row items-center lg:items-center justify-center gap-4 lg:gap-6 px-2 py-0"
          >
            {/* Left Column: Sudoku Grid Block */}
            <div className="w-full max-w-[calc(100vh-160px)] aspect-square flex-1 flex flex-col justify-center self-center">
              <div className="w-full aspect-square bg-transparent p-0 rounded-3xl shadow-none overflow-hidden grid grid-cols-9 gap-0 border-2 border-slate-450 dark:border-slate-600">
                {board.map((row, r) =>
                  row.map((cell, c) => {
                    const borderRight = (c === 2 || c === 5) 
                      ? 'border-r-[3.5px] border-slate-450 dark:border-slate-600' 
                      : (c === 8 ? '' : 'border-r border-slate-450 dark:border-slate-600');
                    const borderBottom = (r === 2 || r === 5) 
                      ? 'border-b-[3.5px] border-slate-450 dark:border-slate-600' 
                      : (r === 8 ? '' : 'border-b border-slate-450 dark:border-slate-600');

                    const isIncorrect = cell.value !== 0 && cell.value !== solution[r][c];

                    return (
                      <div
                        key={`${r}-${c}`}
                        onClick={() => handleCellClick(r, c)}
                        className={`relative aspect-square flex items-center justify-center cursor-pointer transition-all duration-150 select-none ${borderRight} ${borderBottom} ${getCellHighlightClass(r, c)}`}
                      >
                        {selectedCell && selectedCell.row === r && selectedCell.col === c && (
                          <m.div
                            layoutId="sudoku-active-cell"
                            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                            className={`absolute inset-0 border-2 border-emerald-500 bg-emerald-500/15 dark:bg-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.35)] z-20 pointer-events-none ${getCornerRadiusClass(r, c)}`}
                          />
                        )}
                        {cell.value !== 0 ? (
                          <span className={`text-2xl md:text-4xl xl:text-5xl font-black ${
                            cell.isOriginal 
                              ? 'text-slate-900 dark:text-white font-black' 
                              : cell.isHint
                                ? 'text-purple-600 dark:text-purple-400 font-extrabold'
                                : isIncorrect
                                  ? 'text-red-500 dark:text-red-400 font-bold'
                                  : 'text-emerald-600 dark:text-emerald-400 font-bold'
                          }`}>
                            {cell.value}
                          </span>
                        ) : (
                          // Notes Marks
                          <div className="absolute inset-1 grid grid-cols-3 grid-rows-3 gap-[1px] p-[1px] text-[10px] md:text-[14px] xl:text-[16px] text-slate-400 dark:text-slate-500 font-bold">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                              <span key={num} className="flex items-center justify-center leading-none">
                                {cell.notes.includes(num) ? num : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Controls & Numpad Tool Block */}
            <div className="w-full max-w-[460px] xl:max-w-[500px] 2xl:max-w-[540px] flex flex-col justify-between gap-2.5 py-0 self-center">
              {/* Status statistics panel */}
              <div className="w-full flex justify-between items-center px-4 py-2 bg-transparent border border-border rounded-2xl shadow-none text-sm">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                  <span>Chế độ:</span>
                  <span className={difficulty === 'master' ? 'text-rose-500' : (difficulty === 'very-hard' ? 'text-amber-500' : 'text-emerald-500')}>
                    {difficulty === 'master' ? 'Bậc thầy' : (difficulty === 'very-hard' ? 'Rất khó' : 'Khó')}
                  </span>
                </div>
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-base">
                    <Timer size={18} className="text-emerald-500" />
                    {formatTime(timer)}
                  </div>
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <AlertTriangle size={18} className="text-red-500" />
                    Lỗi: <span className="text-red-500 font-bold text-base">{errors}/3</span>
                  </div>
                </div>
              </div>

              {/* Action tools row */}
              <div className="w-full grid grid-cols-4 gap-2">
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className="py-3 rounded-2xl bg-transparent border border-border text-slate-600 dark:text-slate-300 hover:bg-transparent-panel0/10 font-bold text-[11px] uppercase tracking-wider flex flex-col items-center gap-1.5 justify-center disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
                >
                  <Undo size={18} />
                  Undo
                </button>

                <button
                  onClick={handleErase}
                  disabled={!selectedCell || board[selectedCell.row][selectedCell.col].isOriginal || board[selectedCell.row][selectedCell.col].isHint}
                  className="py-3 rounded-2xl bg-transparent border border-border text-red-500 hover:bg-red-500/10 font-bold text-[11px] uppercase tracking-wider flex flex-col items-center gap-1.5 justify-center disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
                >
                  <Trash2 size={18} />
                  Xóa
                </button>

                <button
                  onClick={() => setNotesMode(prev => !prev)}
                  className={`py-3 rounded-2xl font-bold text-[11px] uppercase tracking-wider flex flex-col items-center gap-1.5 justify-center border transition-all shadow-sm ${
                    notesMode 
                      ? 'bg-emerald-500 text-white border-emerald-500' 
                      : 'bg-transparent border border-border text-slate-600 dark:text-slate-300 hover:bg-transparent-panel0/10'
                  }`}
                >
                  <Lightbulb size={18} />
                  Nháp: {notesMode ? 'Bật' : 'Tắt'}
                </button>

                <button
                  onClick={handleHint}
                  disabled={!selectedCell || board[selectedCell.row][selectedCell.col].isOriginal || board[selectedCell.row][selectedCell.col].isHint || board[selectedCell.row][selectedCell.col].value === solution[selectedCell.row][selectedCell.col]}
                  className="py-3 rounded-2xl bg-transparent border border-border text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-bold text-[11px] uppercase tracking-wider flex flex-col items-center gap-1.5 justify-center disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
                >
                  <Gamepad2 size={18} />
                  Gợi ý
                </button>
              </div>

              {/* New Game & Reset Game Row */}
              <div className="w-full grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (window.confirm("Bạn có chắc chắn muốn chơi lại ván này? Toàn bộ tiến trình hiện tại sẽ bị xóa.")) {
                      triggerSound('erase');
                      const resetBoard = board.map((r) => r.map((c) => {
                        if (c.isOriginal) return c;
                        return { ...c, value: 0, notes: [], isHint: false };
                      }));
                      setBoard(resetBoard);
                      setErrors(0);
                      setTimer(0);
                      setHistory([]);
                      setSelectedCell(null);
                      setSelectedNumber(null);
                    }
                  }}
                  className="py-2.5 rounded-2xl bg-transparent border border-border text-slate-600 dark:text-slate-300 hover:bg-transparent-panel0/10 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
                >
                  <RefreshCw size={14} />
                  Chơi lại (Reset)
                </button>

                <button
                  onClick={() => setShowNewGameModal(true)}
                  className="py-2.5 rounded-2xl bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 hover:dark:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Play size={14} fill="white" />
                  Ván mới (New Game)
                </button>
              </div>

              {/* Virtual Numpad */}
              <div className="w-full grid grid-cols-3 gap-2 bg-transparent border border-border rounded-3xl p-3 shadow-none flex-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                  const remaining = getRemainingCount(num);
                  const isCompleted = remaining === 0;
                  const isSelected = selectedNumber === num;

                  return (
                     <m.button
                      key={num}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCellInput(num)}
                      className={`relative py-3 lg:py-4 xl:py-5 rounded-2xl font-black text-2xl flex flex-col items-center justify-center transition-all select-none shadow-sm ${
                        isCompleted 
                          ? 'bg-transparent/50 dark:bg-slate-800/10 text-slate-400 dark:text-slate-600 pointer-events-none' 
                          : isSelected
                            ? 'bg-emerald-500 text-white border border-emerald-600 dark:border-emerald-400 scale-105 z-10'
                            : 'bg-transparent hover:bg-slate-550/10 border border-border text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <span>{num}</span>
                      <span className={`text-[10px] font-bold mt-[-2px] ${isSelected ? 'text-white/80' : isCompleted ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {isCompleted ? '✓' : remaining}
                      </span>
                    </m.button>
                  );
                })}
              </div>
            </div>
          </m.div>
        )}

        {/* WON STATE */}
        {gameState === 'won' && (
          <m.div
            key="won"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md bg-transparent border border-border rounded-[2rem] p-8 shadow-none text-center flex flex-col items-center gap-6 relative overflow-hidden mt-8"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

            <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <CheckCircle2 size={56} className="animate-bounce" />
            </div>

            <div>
              <h2 className="text-3xl font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">CHIẾN THẮNG!</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-bold">
                Chúc mừng! Bạn đã giải xuất sắc Sudoku chế độ{' '}
                <span className="text-emerald-500">
                  {difficulty === 'master' ? 'Bậc thầy' : (difficulty === 'very-hard' ? 'Rất khó' : 'Khó')}
                </span>!
              </p>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 bg-transparent p-4 rounded-2xl text-sm border border-border">
              <div>
                <div className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Thời gian giải</div>
                <div className="text-slate-800 dark:text-white font-mono text-lg font-black mt-1">{formatTime(timer)}</div>
              </div>
              <div>
                <div className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">Số lỗi mắc phải</div>
                <div className="text-slate-800 dark:text-white font-mono text-lg font-black mt-1">{errors}/3</div>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2">
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startNewGame(difficulty)}
                className="w-full py-4 rounded-2xl bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 hover:dark:bg-emerald-600 text-white font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20"
              >
                Chơi game mới
              </m.button>
              <button
                onClick={() => setGameState('menu')}
                className="w-full py-4 rounded-2xl bg-transparent border border-border text-slate-700 dark:text-slate-300 font-black uppercase tracking-wider text-xs"
              >
                Trở về menu
              </button>
            </div>
          </m.div>
        )}

        {/* LOST STATE */}
        {gameState === 'lost' && (
          <m.div
            key="lost"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md bg-transparent border border-border rounded-[2rem] p-8 shadow-none text-center flex flex-col items-center gap-6 relative overflow-hidden mt-8"
          >
            <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500">
              <AlertTriangle size={56} className="animate-pulse" />
            </div>

            <div>
              <h2 className="text-3xl font-black uppercase tracking-widest text-red-500">GAME OVER</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-bold">
                Bạn đã vượt quá số lỗi giới hạn (3 lỗi). Hãy thử lại lần nữa nhé!
              </p>
            </div>

            <div className="w-full flex flex-col gap-2">
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startNewGame(difficulty)}
                className="w-full py-4 rounded-2xl bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 hover:dark:bg-emerald-600 text-white font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20"
              >
                Thử lại ván mới
              </m.button>
              <button
                onClick={() => setGameState('menu')}
                className="w-full py-4 rounded-2xl bg-transparent border border-border text-slate-700 dark:text-slate-300 font-black uppercase tracking-wider text-xs"
              >
                Trở về menu
              </button>
            </div>
          </m.div>
        )}

        {/* NEW GAME MODAL (DIFFICULTY SELECTOR) */}
        <AnimatePresence>
          {showNewGameModal && (
            <m.div
              key="new-game-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#0a0f1d]/60 backdrop-blur-md z-[2000] flex items-center justify-center p-4"
            >
              <m.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="w-full max-w-md bg-transparent dark:bg-[#0c1424]/90 backdrop-blur-xl border border-border rounded-[2rem] p-8 shadow-2xl text-center flex flex-col gap-6 relative overflow-hidden"
              >
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-widest text-[#2d5016] dark:text-[#4a7c59]">BẮT ĐẦU VÁN MỚI</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    Chọn mức độ khó cho ván chơi mới của bạn. Tiến trình chơi hiện tại của ván này sẽ bị hủy bỏ.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <m.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startNewGame('hard')}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2d5016] to-[#4a7c59] hover:from-[#37611b] hover:to-[#579068] text-white font-black uppercase tracking-widest shadow-lg shadow-[#2d5016]/10 flex items-center justify-center gap-2 text-sm duration-300"
                  >
                    Độ khó: KHÓ (Hard)
                  </m.button>

                  <m.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startNewGame('very-hard')}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8b6f47] to-[#d4a574] hover:from-[#a08153] hover:to-[#e3b785] text-white font-black uppercase tracking-widest shadow-lg shadow-[#8b6f47]/10 flex items-center justify-center gap-2 text-sm duration-300"
                  >
                    Độ khó: RẤT KHÓ (Very Hard)
                  </m.button>

                  <m.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startNewGame('master')}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#9b1c1c] to-[#e02424] hover:from-[#b91c1c] hover:to-[#ef4444] text-white font-black uppercase tracking-widest shadow-lg shadow-rose-900/10 flex items-center justify-center gap-2 text-sm duration-300"
                  >
                    Độ khó: BẬC THẦY (Master)
                  </m.button>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-800" />

                <button
                  onClick={() => setShowNewGameModal(false)}
                  className="w-full py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-transparent dark:hover:bg-slate-800/40 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Hủy bỏ (Cancel)
                </button>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
        )}
      </div>
      </div>
    </div>
  );
}
