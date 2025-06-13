const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const tileSize = 20;
const gridSize = 24;
const bombTimer = 20; // 2 sec (assuming 10 FPS)
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

let player = { x: 1, y: 1, lives: 2 };
let bots = [
  { x: 22, y: 1 }, { x: 1, y: 22 }, { x: 22, y: 22 }
];
let bombs = [];
let explosions = [];

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dessiner le labyrinthe
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (maze[y][x] === 1) {
        ctx.fillStyle = "#444";
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }

  // Dessiner les bombes
  for (let b of bombs) {
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(b.x * tileSize + tileSize/2, b.y * tileSize + tileSize/2, tileSize/4, 0, Math.PI*2);
    ctx.fill();
  }

  // Dessiner les explosions (zone 2x2)
  for (let e of explosions) {
    ctx.fillStyle = "orange";
    for (let dx = 0; dx < 2; dx++) {
      for (let dy = 0; dy < 2; dy++) {
        ctx.fillRect((e.x + dx) * tileSize, (e.y + dy) * tileSize, tileSize, tileSize);
      }
    }
  }

  // Dessiner le joueur
  ctx.fillStyle = "blue";
  ctx.fillRect(player.x * tileSize, player.y * tileSize, tileSize, tileSize);

  // Dessiner les bots
  ctx.fillStyle = "red";
  for (let bot of bots) {
    ctx.fillRect(bot.x * tileSize, bot.y * tileSize, tileSize, tileSize);
  }

  // Afficher vies joueur
  ctx.fillStyle = "black";
  ctx.font = "16px Arial";
  ctx.fillText("Vies: " + player.lives, 10, canvas.height - 10);
}

function isFree(x, y) {
  return maze[y] && maze[y][x] === 0 &&
    !bombs.some(b => b.x === x && b.y === y);
}

// Déplacement bots aléatoire simple
function moveBots() {
  for (let bot of bots) {
    let dirs = [
      {x:0,y:-1},
      {x:0,y:1},
      {x:-1,y:0},
      {x:1,y:0}
    ];
    let possibles = dirs.filter(d => isFree(bot.x + d.x, bot.y + d.y));
    if (possibles.length > 0) {
      let move = possibles[Math.floor(Math.random() * possibles.length)];
      bot.x += move.x;
      bot.y += move.y;
    }
  }
}

function updateBombs() {
  for (let i = bombs.length - 1; i >= 0; i--) {
    bombs[i].timer--;
    if (bombs[i].timer <= 0) {
      explosions.push({ x: bombs[i].x, y: bombs[i].y, timer: explosionDuration });
      bombs.splice(i, 1);
    }
  }
}

function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].timer--;

    // Check dégâts joueur
    if (player.x >= explosions[i].x && player.x < explosions[i].x + 2 &&
        player.y >= explosions[i].y && player.y < explosions[i].y + 2) {
      player.lives--;
      if (player.lives <= 0) {
        document.getElementById("game-over").style.display = "block";
        clearInterval(gameInterval);
      }
    }

    // Check dégâts bots
    bots = bots.filter(bot =>
      !(bot.x >= explosions[i].x && bot.x < explosions[i].x + 2 &&
        bot.y >= explosions[i].y && bot.y < explosions[i].y + 2)
    );

    if (explosions[i].timer <= 0) {
      explosions.splice(i, 1
