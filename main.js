const canvas = document.getElementById("gameCanvas")
const ctx = canvas.getContext("2d")

// image loader
const loadImg = (path) => Object.assign(new Image(), { src: path })

// player sprite
const playerSprite = loadImg("sprites/tempPlayer.png")

// east
const east1 = loadImg("sprites/east1.png")
const east2 = loadImg("sprites/east2.png")
const east3 = loadImg("sprites/east3.png")

// west
const west1 = loadImg("sprites/west1.png")
const west2 = loadImg("sprites/west2.png")
const west3 = loadImg("sprites/west3.png")
const west4 = loadImg("sprites/west4.png")

// config
const CONFIG = {
    TILE_SIZE: 32,
    MAP_WIDTH: 64,
    MAP_HEIGHT: 64,
    MOVE_SPEED: 3,
    SCALE: 4
}

// USER STATE (x, y)
const userState = {
    x: 5,
    y: 5,
    isMoving: false,
    isWalkingEast: false,
    isWalkingWest: false,
    facing: 'S',
    // animation
    animFrame: 0,
    animTimer: 0
}

// movement
const PLAYER_SPRITES = {
    'W': [west1, west2, west3, west4], // 4-frame animation
    'E': [east1, east3, east1, east3], // placeholder

    // TOOD: N, S, NE, NW, SW, SE
    'N': [west1, west2, west3, west4],
    'S': [west1, west2, west3, west4],
    'NE': [west1, west2, west3, west4],
    'NW': [west1, west2, west3, west4],
    'SW': [west1, west2, west3, west4],
    'SE': [west1, west2, west3, west4]
}

// KEY STATES
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
}
const validKeys = ["w", "a", "s", "d", "escape"]

// RENDERING VARIABLES
let isResizing = false
let resizeTimer = 0
let lastMoveTime = 0;

// MAP 
// tile id dictionary
const TILE_TYPE = {
    "GRASS": 0,
    "WATER": 1,
    "BUSH": 2,
    "TREE": 3,
    "WALL": 4,
    "GRASS2": 10,
    "GRASS3": 11,
    "GRASS4": 12,
    "GRASS5": 13,
    "COLLIDER": 99
}

const grassSprite = loadImg("sprites/grass.png")
const waterSprite = loadImg("sprites/water.png")

// grass variation test
const grass2Sprite = loadImg("sprites/grass2.png")
const grass3Sprite = loadImg("sprites/grass3.png")
const grass4Sprite = loadImg("sprites/grass4.png")
const grass5Sprite = loadImg("sprites/grass5.png")

const grassVariants = {
    [TILE_TYPE.GRASS]: 90,
    [TILE_TYPE.GRASS2]: 2.5,
    [TILE_TYPE.GRASS3]: 2.5,
    [TILE_TYPE.GRASS4]: 2.5,
    [TILE_TYPE.GRASS5]: 0.5,
}

function pickGrassTile() {
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (const [id, chance] of Object.entries(grassVariants)) {
        cumulative += chance;
        if (roll < cumulative) return parseInt(id);
    }
    return TILE_TYPE.GRASS;
}


const bushSprite = new Image()
const trunkSprite = new Image()
const leavesSprite = new Image()
bushSprite.src = "sprites/bush.png"
trunkSprite.src = "sprites/trunk.png"
// leavesSprite.src = "sprites/leaves.png"

// L1: [BASE] grass, water 
// L2: [OBSTACLES / STRUCTURES] trunk, rocks, walls
// L3: USER LAYER
// L4: [OVERLAYS] bush, leaves
// L5: [AIR/ATMOSPHERE] birds, butterflies etc flying around

// layer 1 array 
const mapL1 = Array.from({ length: CONFIG.MAP_HEIGHT }, (_, y) =>
    Array.from({ length: CONFIG.MAP_WIDTH }, (_, x) => {
        // The Rule: If we are within 3 tiles of any edge, return WATER
        if (x < 3 || x >= CONFIG.MAP_WIDTH - 3 || y < 3 || y >= CONFIG.MAP_HEIGHT - 3) {
            return TILE_TYPE.WATER;
        }
        // Otherwise, return a random GRASS variant
        return pickGrassTile();
    })
);

// layer 2 array (Obstacles/Deco)
// Initialized to null (empty) for manual painting
const mapL2 = Array.from({ length: CONFIG.MAP_HEIGHT }, () =>
    Array.from({ length: CONFIG.MAP_WIDTH }, () => null)
);


// --- MANUAL MAP PAINTING ---
// mapL2[y][x] = TILE_TYPE.BUSH
mapL2[10][10] = TILE_TYPE.BUSH
mapL2[10][20] = TILE_TYPE.BUSH
mapL2[12][15] = TILE_TYPE.TREE
mapL2[15][10] = TILE_TYPE.TREE

// camera state (x, y)
const camera = {
    x: 0,
    y: 0
};

// handle window resize
function resizeHandle() {
    // 1. enter resizing mode
    isResizing = true
    canvas.classList.add("blur-mode")

    // 2. cancel previous timer
    // note: clearTimeout(timeoutID) cancels a previously set timeout so the function never runs
    clearTimeout(resizeTimer)

    // 3. start new countdown (AFTER user stops dragging)
    // note: setTimeout(fn, delay) schedules a function to run once after a specififed number of milliseconds. returns a timeout ID
    resizeTimer = setTimeout(() => {
        // set width / height
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        ctx.scale(CONFIG.SCALE, CONFIG.SCALE)

        // re-disbale smoothing since change width height resets context
        ctx.imageSmoothingEnabled = false

        // exit resizing mode
        isResizing = false
        canvas.classList.remove("blur-mode")
        console.log(`resized to: ${canvas.width}x${canvas.height}`)
    }, 200)
}
window.addEventListener("resize", resizeHandle)


// check if tile is good to move to
function goodTile(x, y) {
    x = Math.floor(x)
    y = Math.floor(y)

    // bounds
    if (x < 0 || x >= CONFIG.MAP_WIDTH || y < 0 || y >= CONFIG.MAP_HEIGHT) {
        return false
    }
    // obstacles
    // if mapL2[y][x] is an obstacle, return false
    if (mapL2[y][x] === 3) {
        return false
    }

    return true
}

function update(dt) {
    // update player position here since it runs at a steady 60fps
    const dist = CONFIG.MOVE_SPEED * dt

    // calculate new position
    let newX = userState.x
    let newY = userState.y

    // movement state
    userState.isMoving = (keys.w || keys.a || keys.s || keys.d)
    userState.isWalkingEast = keys.d
    userState.isWalkingWest = keys.a

    if (keys.w) newY -= dist
    if (keys.s) newY += dist
    if (keys.a) newX -= dist
    if (keys.d) newX += dist

    // COLLISION
    // We check collision at the feet (y + 0.8)
    // We check both the left (x + 0.2) and right (x + 0.8) of the feet
    const feetY = userState.y + 1;
    const newFeetY = newY + 1;
    // --- X MOVEMENT ---
    if (goodTile(newX, feetY) && goodTile(newX + 1, feetY)) {
        userState.x = newX;
    }
    // --- Y MOVEMENT ---
    if (goodTile(userState.x, newFeetY) && goodTile(userState.x + 1, newFeetY)) {
        userState.y = newY;
    }

    // MOVEMENT
    // movement state for animation
    userState.isMoving = (keys.w || keys.a || keys.s || keys.d)

    // get direction
    let dirY = keys.w ? "N" : (keys.s ? "S" : "")
    let dirX = keys.a ? "W" : (keys.d ? "E" : "")

    if (dirY || dirX) userState.facing = dirY + dirX

    // animation timer logic
    if (userState.isMoving) {
        userState.animTimer += dt
        // swap frame every 0.15 sec
        if (userState.animTimer > 0.15) {
            userState.animTimer = 0
            userState.animFrame = (userState.animFrame + 1) % 4
        }
    } else { // reset if idle
        userState.animFrame = 0
        userState.animTimer = 0
    }

    // CAMERA
    // find center of current frame/screen
    const centerX = (canvas.width / CONFIG.SCALE) / 2
    const centerY = (canvas.height / CONFIG.SCALE) / 2

    // set camera x, y (player position - camera offset = screen center)
    camera.x = (userState.x * CONFIG.TILE_SIZE) - centerX + (CONFIG.TILE_SIZE / 2);
    camera.y = (userState.y * CONFIG.TILE_SIZE) - centerY + (CONFIG.TILE_SIZE / 2);


    // prevent camera from going off map
    // stop camera x, y from going below 0
    if (camera.x < 0) camera.x = 0;
    if (camera.y < 0) camera.y = 0;

    // stop camera x,y from going beyond map width, height
    const mapPixelWidth = CONFIG.MAP_WIDTH * CONFIG.TILE_SIZE;
    const mapPixelHeight = CONFIG.MAP_HEIGHT * CONFIG.TILE_SIZE;

    const maxCameraX = mapPixelWidth - (canvas.width / CONFIG.SCALE);
    const maxCameraY = mapPixelHeight - (canvas.height / CONFIG.SCALE);

    if (camera.x > maxCameraX) camera.x = maxCameraX;
    if (camera.y > maxCameraY) camera.y = maxCameraY;

}

function draw() {
    // clear previous frame's pixels
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // L1: map
    for (let i = 0; i < mapL1.length; i++) {
        for (let j = 0; j < mapL1[i].length; j++) {
            let sprite = null
            let id = mapL1[i][j]

            if (id === TILE_TYPE.GRASS) sprite = grassSprite
            if (id === TILE_TYPE.GRASS2) sprite = grass2Sprite
            if (id === TILE_TYPE.GRASS3) sprite = grass3Sprite
            if (id === TILE_TYPE.GRASS4) sprite = grass4Sprite
            if (id === TILE_TYPE.GRASS5) sprite = grass5Sprite
            if (id === TILE_TYPE.WATER) sprite = waterSprite

            if (sprite) {
                ctx.drawImage(
                    sprite,
                    Math.floor((j * CONFIG.TILE_SIZE) - camera.x),
                    Math.floor((i * CONFIG.TILE_SIZE) - camera.y),
                    CONFIG.TILE_SIZE,
                    CONFIG.TILE_SIZE
                );
            }
        }
    }

    // L2: obstacles
    for (let i = 0; i < mapL2.length; i++) {
        for (let j = 0; j < mapL2[i].length; j++) {
            let sprite = null
            let id = mapL2[i][j]
            if (!id) continue
            if (id === TILE_TYPE.TREE) sprite = trunkSprite

            if (sprite && sprite.complete) {
                const offsetW = sprite.width - CONFIG.TILE_SIZE
                const offsetH = sprite.height - CONFIG.TILE_SIZE

                ctx.drawImage(
                    sprite,
                    Math.floor((j * CONFIG.TILE_SIZE) - camera.x),
                    Math.floor((i * CONFIG.TILE_SIZE) - camera.y - offsetH),
                    sprite.width,
                    sprite.height
                );
            }
        }
    }

    // L3: draw player (subtract camera offset)
    // ctx.drawImage(image, dx, dy, dWidth, dHeight)
    // dx (destination x) - horizontal coord where image starts
    // dy (destination y) - vertical coord where image starts

    // determine sprite
    const animation = PLAYER_SPRITES[userState.facing] || PLAYER_SPRITES['S']
    let spriteToDraw = userState.isMoving ? animation[userState.animFrame] : playerSprite

    ctx.drawImage(
        spriteToDraw,
        (userState.x * CONFIG.TILE_SIZE) - camera.x,
        (userState.y * CONFIG.TILE_SIZE) - camera.y,
        CONFIG.TILE_SIZE,
        CONFIG.TILE_SIZE
    );

    // L4: overlays
    for (let i = 0; i < mapL2.length; i++) {
        for (let j = 0; j < mapL2[i].length; j++) {
            const id = mapL2[i][j];

            if (id === TILE_TYPE.BUSH) {
                const sprite = bushSprite
                ctx.drawImage(
                    sprite,
                    Math.floor((j * CONFIG.TILE_SIZE) - camera.x),
                    Math.floor((i * CONFIG.TILE_SIZE) - camera.y),
                    sprite.width,
                    sprite.height
                );
            }

            if (id === TILE_TYPE.TREE) {
                if (leavesSprite.complete) {
                    ctx.drawImage(
                        leavesSprite,
                        Math.floor((j * CONFIG.TILE_SIZE) - camera.x),
                        Math.floor((i * CONFIG.TILE_SIZE) - camera.y - leavesSprite.height),
                        leavesSprite.width,
                        leavesSprite.height
                    )
                }
            }
        }
    }


}

// key logic (movement and pause)
window.addEventListener("keydown", keydownHandle)
window.addEventListener("keyup", keyupHandle)
window.addEventListener("blur", () => {
    // reset all keys to false when the player leaves the window
    keys.w = false; keys.a = false; keys.s = false; keys.d = false;
});

function keydownHandle(e) {
    // check if e.key is valid key. we want to handle wasd and esc
    const key = e.key.toLowerCase()
    if (!validKeys.includes(key)) return
    if (key === "escape") {
        // todo: pause logic
        console.log("escape")
        return
    }

    // handle each key
    keys[key] = true
    return
}

function keyupHandle(e) {
    keys[e.key.toLowerCase()] = false
}

// core loop (state -> update -> render)
function gameLoop(timestamp) {
    // perform work and render if not resizing
    if (!isResizing) {
        // calculate dt in seconds and render 
        // dt is the exact amt of time passed btwn previous and curr frame
        let dt = (timestamp - lastMoveTime) / 1000
        if (dt > 0.1) dt = 0.1

        // stamps current time
        lastMoveTime = timestamp

        // update position and draw
        update(dt)
        draw()
    }

    // recursive call to continue
    requestAnimationFrame(gameLoop)
}

// inital size and gameLoop
resizeHandle();

// timestamp is similar to performance.now(), given from browser
requestAnimationFrame((timestamp) => {
    lastMoveTime = timestamp;
    gameLoop(timestamp);
});