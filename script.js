
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 24;
const tileSize = canvas.width / gridSize;

const playerColor = '#4CAF50';
const botColors = ['#FF5733', '#33C1FF', '#FF33C4'];
const bombColor = '#000000';
const explosionColor = '#FFD700';


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

let grid = maze;
let player = { x: 1, y: 1, hasBomb: false, lives: 2, alive: true };
let bots = [
    { x: 22, y: 1, hasBomb: false, alive: true },
    { x: 1, y: 22, hasBomb: false, alive: true },
    { x: 22, y: 22, hasBomb: false, alive: true }
];
let bombs = [];
let bombItems = [];
let explosions = [];
let gameOver = false;

const keys = { z: [-1, 0], s: [1, 0], q: [0, -1], d: [0, 1] };

document.addEventListener('keydown', e => {
    if (gameOver) return;
    if (keys[e.key]) {
        move(player, keys[e.key]);
    } else if (e.key === ' ') {
        placeBomb(player);
    }
});

function move(entity, dir) {
    const [dy, dx] = dir;
    const newY = entity.y + dy;
    const newX = entity.x + dx;
    if (isInside(newY, newX) && grid[newY][newX] === 0) {
        entity.y = newY;
        entity.x = newX;
    }
}

function isInside(y, x) {
    return y >= 0 && y < gridSize && x >= 0 && x < gridSize;
}

function placeBomb(entity) {
    if (entity.hasBomb) {
        bombs.push({ x: entity.x, y: entity.y, time: Date.now() + 2000 });
        entity.hasBomb = false;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grille
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            ctx.strokeStyle = '#ccc';
            ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
    }

    // Bombes posées
    bombs.forEach(b => {
        ctx.fillStyle = bombColor;
        ctx.fillRect(b.x * tileSize, b.y * tileSize, tileSize, tileSize);
    });

    // Bombes à ramasser
    bombItems.forEach(b => {
        ctx.fillStyle = '#8B008B';
        ctx.beginPath();
        ctx.arc(b.x * tileSize + tileSize/2, b.y * tileSize + tileSize/2, tileSize/3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Explosions
    explosions.forEach(exp => {
        ctx.fillStyle = explosionColor;
        exp.area.forEach(([x, y]) => {
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        });
    });

    // Joueur
    if (player.alive) {
        ctx.fillStyle = playerColor;
        ctx.fillRect(player.x * tileSize, player.y * tileSize, tileSize, tileSize);
    }

    // Bots
    bots.forEach((b, i) => {
        if (b.alive) {
            ctx.fillStyle = botColors[i];
            ctx.fillRect(b.x * tileSize, b.y * tileSize, tileSize, tileSize);
        }
    });

    // Game over
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '48px Comic Sans MS';
        ctx.fillText('GAME OVER', canvas.width / 2 - 140, canvas.height / 2);
    }
}

function update() {
    if (gameOver) return;

    if (Math.random() < 0.01) {
        let x = Math.floor(Math.random() * gridSize);
        let y = Math.floor(Math.random() * gridSize);
        bombItems.push({ x, y });
    }

    [player, ...bots].forEach(e => {
        if (!e.hasBomb && e.alive) {
            bombItems = bombItems.filter(b => {
                if (b.x === e.x && b.y === e.y) {
                    e.hasBomb = true;
                    return false;
                }
                return true;
            });
        }
    });

    let now = Date.now();
    bombs = bombs.filter(b => {
        if (b.time <= now) {
            let area = [];
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    area.push([b.x + dx, b.y + dy]);
                }
            }
            explosions.push({ area, time: now + 500 });
            damage(area);
            return false;
        }
        return true;
    });

    // Supprimer vieilles explosions
    explosions = explosions.filter(e => e.time > now);

    bots.forEach(b => {
        if (!b.alive) return;
        let dirs = [[0,1],[0,-1],[1,0],[-1,0]];
        let [dy, dx] = dirs[Math.floor(Math.random()*dirs.length)];
        let newY = b.y + dy;
        let newX = b.x + dx;
        if (isInside(newY, newX) && grid[newY][newX] === 0) {
            b.y = newY;
            b.x = newX;
        }
        if (b.hasBomb && Math.random() < 0.01) placeBomb(b);
    });
}

function damage(area) {
    area.forEach(([x, y]) => {
        if (player.x === x && player.y === y && player.alive) {
            player.lives--;
            if (player.lives <= 0) {
                player.alive = false;
                gameOver = true;
            }
        }
        bots.forEach(bot => {
            if (bot.x === x && bot.y === y && bot.alive) {
                bot.alive = false;
            }
        });
    });
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
