const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const tileSize = 20;
const gridSize = 24;

const bombTimer = 20;  // frames avant explosion (2s)
const explosionDuration = 10;  // frames explosion visible

// Labyrinthe simple: 1 = mur, 0 = sol libre
const maze = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1,1,1,0,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1],
  [1,0,1,1,1,1,0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,1,0,0,1],
  [1,0,1,1,0,1,1,1,1,0,1,1,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,1],
  [1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,0,1,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1],
  [1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0,1],
  [1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,1,0,1],
  [1,0,1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Joueur
let player = {x:1, y:1, lives: 2, bombs: 0};
let bots = [
  {x:22, y:1, bombs: 0},
  {x:1, y:20, bombs: 0},
  {x:22, y:20, bombs: 0}
];

// Bombes au sol et posées
let bombs = [];
let explosions = [];

const bombTimerFrames = 20;
const explosionDurationFrames = 10;

let lastBombSpawnTime = 0;
const bombSpawnInterval = 3000; // 3 sec

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Dessiner labyrinthe
  for(let y=0; y<gridSize; y++){
    for(let x=0; x<gridSize; x++){
      if(maze[y][x] === 1){
        ctx.fillStyle = "#444";
        ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
      } else {
        ctx.fillStyle = "#aee7ff";
        ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
      }
    }
  }
  
  // Bombes au sol (non posées)
  for(let b of bombs){
    if(!b.placed){
      ctx.fillStyle = "purple";
      ctx.beginPath();
      ctx.arc(b.x*tileSize + tileSize/2, b.y*tileSize + tileSize/2, tileSize/4, 0, Math.PI*2);
      ctx.fill();
    }
  }
  
  // Bombes posées
  for(let b of bombs){
    if(b.placed){
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(b.x*tileSize + tileSize/2, b.y*tileSize + tileSize/2, tileSize/4, 0, Math.PI*2);
      ctx.fill();
    }
  }
  
  // Explosions 2x2
  ctx.fillStyle = "orange";
  for(let e of explosions){
    for(let dx=0; dx<2; dx++){
      for(let dy=0; dy<2; dy++){
        ctx.fillRect((e.x+dx)*tileSize, (e.y+dy)*tileSize, tileSize, tileSize);
      }
    }
  }
  
  // Joueur bleu
  ctx.fillStyle = "blue";
  ctx.fillRect(player.x*tileSize, player.y*tileSize, tileSize, tileSize);
  
  // Bots rouges
  ctx.fillStyle = "red";
  for(let b of bots){
    ctx.fillRect(b.x*tileSize, b.y*tileSize, tileSize, tileSize);
  }
  
  // Texte vies + bombes
  ctx.fillStyle = "black";
  ctx.font = "16px Arial";
  ctx.fillText(`Vies: ${player.lives}`, 10, canvas.height - 30);
  ctx.fillText(`Bombes: ${player.bombs}`, 10, canvas.height - 10
