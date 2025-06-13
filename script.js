const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const tileSize = 20;
const gridSize = 24;
const bombTimer = 20; // 2 sec (100ms * 20 = 2s)
const explosionDuration = 10; // frames

// 1 = mur, 0 = sol
const maze = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,1,0,1,0,1,0,0,0,0,1,0,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,1,0,1,0,1,1,1,1,1,1,0,1,0,0,0,0,1,0,1],
  [1,1,1,1,0,1,0,0,0,0,0,1,1,0,0,0,1,0,1,1,0,1,0,1],
  [1,0,0,1,0,1,1,1,1,1,0,0,0,0,1,1,1,0,1,0,0,1,0,1],
  [1,0,0,1,0,0,0,0,0,1,1,1,1,1,0,0,0,0,1,0,1,1,0,1],
  [1,0,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,1],
  [1,0,1,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,0,1],
  [1,0,1,0,1,1,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,1,0,1],
  [1,0,1,0,1,0,0,1,1,1,0,0,0,0,0,0,1,0,1,1,0,1,0,1],
  [1,0,1,0,1,1,0,0,0,1,1,1,1,1,0,0,1,0,0,1,0,0,0,1],
  [1,0,1,0,0,1,1,1,0,0,0,1,0,0,0,1,1,1,0,1,1,1,1,1],
  [1,0,0,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,0,0,0,1,0,0,0,0,1,0,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,1,1,1,0,0,0,1,1,0,1,0,0,0,0,0,0,1,0,1],
  [1,0,1,1,0,0,0,0,0,1,1,1,1,0,1,1,1,1,0,1,0,1,0,1],
  [1,0,1,0,0,1,1,1,1,1,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
  [1,0,0,0,1,1,0,0,0,0,1,1,1,1,1,1,0,1,1,1,0,1,0,1],
  [1,0,1,1,1,0,0,1,1,1,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,0,1,1,0,1,1,1,1,1,0,0,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,1,1,0,0,1,0,0,0,1,1,1,0,0,0,0,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,1,0,1,0,0,0,1,1,1,1,1,0,1,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Inventaire bombes du joueur
let player = { x: 1, y: 1, lives: 2, bombs: 0 };

let bots = [
  { x: 22, y: 1, bombs: 0 },
  { x: 1, y: 22, bombs: 0 },
  { x: 22, y: 22, bombs: 0 }
];

let bombs = [];
let explosions = [];

let bombSpawnInterval = 5000; // 5 sec
let lastBombSpawn = 0;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Labyrinthe
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (maze[y][x] === 1) {
        ctx.fillStyle = "#444";
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      } else {
        ctx.fillStyle = "#aee7ff";
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }

  // Bombes au sol (à ramasser)
  for (let b of bombs) {
    if (!b.placed) {
      ctx.fillStyle = "purple";
      ctx.beginPath();
      ctx.arc(b.x * tileSize + tileSize/2, b.y * tileSize + tileSize/2, tileSize/4, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // Bombes posées (avec timer)
  for (let b of bombs) {
    if (b.placed) {
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(b.x * tileSize + tileSize/2, b.y * tileSize + tileSize/2, tileSize/4, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // Explosions (2x2)
  for (let e of explosions) {
    ctx.fillStyle = "orange";
    for (let dx = 0; dx < 2; dx++) {
      for (let dy = 0; dy < 2; dy++) {
        ctx.fillRect((e.x + dx) * tileSize, (e.y + dy) * tileSize, tileSize, tileSize);
      }
    }
  }

  // Joueur
  ctx.fillStyle = "blue";
  ctx.fillRect(player.x * tileSize, player.y * tileSize, tileSize, tileSize);

  // Bots
  ctx.fillStyle = "red";
  for (let bot of bots) {
    ctx.fillRect(bot.x * tileSize, bot.y * tileSize, tileSize, tileSize);
  }

  // Infos vies + bombes
  ctx.fillStyle = "black";
  ctx.font = "16px Arial";
  ctx.fillText(`Vies: ${player.lives}`, 10, canvas.height - 30);
  ctx.fillText(`Bombes: ${player.bombs}`, 10, canvas.height - 10);
}

// Check si case libre (pas mur et pas bombe posée)
function isFree(x, y) {
  if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) return false;
  if (maze[y][x] === 1) return false;
  if (bombs.some(b => b.placed && b.x === x && b.y === y)) return false;
  return true;
}

// Déplacer bots simple IA (avec prise en compte bombes, murs)
function moveBots() {
  for (let bot of bots) {
    // Aléatoire déplacement possible
    let directions = [
      { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
    ];
    let possible = directions.filter(d => isFree(bot.x + d.x, bot.y + d.y));
    if (possible.length > 0) {
      let choice = possible[Math.floor(Math.random() * possible.length)];
      bot.x += choice.x;
      bot.y += choice.y;

      // Ramasse bombe au sol si disponible
      let bombIndex = bombs.findIndex(b => !b.placed && b.x === bot.x && b.y === bot.y);
      if (bombIndex !== -1) {
        bombs.splice(bombIndex, 1);
        bot.bombs++;
      }

      // Pose bombe si il en a
      if (bot.bombs > 0 && Math.random() < 0.05) {
        placeBomb(bot.x, bot.y, bot);
        bot.bombs--;
      }
    }
  }
}

// Mise à jour des bombes
function updateBombs() {
  for (let i = bombs.length - 1; i >= 0; i--) {
    let b = bombs[i];
    if (b.placed) {
      b.timer--;
      if (b.timer <= 0) {
        // Explosion
        explosions.push({ x: b.x, y: b.y, timer: explosionDuration });
        bombs.splice(i, 1);
      }
    }
  }
}

// Mise à jour des explosions
function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    let e = explosions[i];
    e.timer--;
    if (e.timer <= 0) {
      explosions.splice(i, 1);
    } else {
      // Check collision joueur
      if (player.lives > 0 && inExplosion(e, player.x, player.y)) {
        player.lives--;
        if (player.lives <= 0) {
          showGameOver();
        }
      }
      // Check collision bots
      for (let j = bots.length - 1; j >= 0; j--) {
        if (inExplosion(e, bots[j].x, bots[j].y)) {
          bots.splice(j, 1);
        }
      }
    }
  }
}

function inExplosion(explosion, x, y) {
  return x >= explosion.x && x < explosion.x + 2 && y >= explosion.y && y < explosion.y + 2;
}

// Poser bombe par joueur
function placeBomb(x, y, owner=player) {
  if (!bombs.some(b => b.x === x && b.y === y && b.placed)) {
    bombs.push({ x, y, timer: bombTimer, placed: true });
  }
}

// Génération aléatoire de bombes au sol
function spawnBombs(timestamp) {
  if (!lastBombSpawn) lastBombSpawn = timestamp;
  if (timestamp - lastBombSpawn > bombSpawnInterval) {
    // Chercher case libre pour bombe
    let freeSpots = [];
    for (let y=0; y<gridSize; y++) {
      for (let x=0; x<gridSize; x++) {
        if (maze[y][x] === 0 && !bombs.some(b => b.x === x && b.y === y)) {
          freeSpots.push({x,y});
        }
      }
    }
    if (freeSpots.length > 0) {
      let spot = freeSpots[Math.floor(Math.random() * freeSpots.length)];
      bombs.push({ x: spot.x, y: spot.y, placed: false });
    }
    lastBombSpawn = timestamp;
  }
}

// Gestion des touches ZQSD + pose bombe avec espace
document.addEventListener("keydown", (e) => {
  if (document.getElementById("game-over").style.display === "block") return;

  let newX = player.x;
  let newY = player.y;

  switch (e.key.toLowerCase()) {
    case "z": newY--; break;
    case "s": newY++; break;
    case "q": newX--; break;
    case "d": newX++; break;
    case " ":
      if (player.bombs > 0) {
        placeBomb(player.x, player.y);
        player.bombs--;
      }
      return;
    default:
      return;
  }

  if (isFree(newX, newY)) {
    player.x = newX;
    player.y = newY;

    // Ramasse bombe au sol
    let bombIndex = bombs.findIndex(b => !b.placed && b.x === player.x && b.y === player.y);
    if (bombIndex !== -1) {
      bombs.splice(bombIndex, 1);
      player.bombs++;
    }
  }
});

// Game over
function showGameOver() {
  document.getElementById("game-over").style.display = "block";
}

// Boucle principale
function gameLoop(timestamp) {
  moveBots();
  updateBombs();
  updateExplosions();
  spawnBombs(timestamp);
  draw();
  if (player.lives > 0) {
    requestAnimationFrame(gameLoop);
  }
}

requestAnimationFrame(gameLoop);
