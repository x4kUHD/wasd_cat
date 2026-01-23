const canvas = document.getElementById("gameCanvas")
const ctx = canvas.getContext("2d")


// player sprite
const playerSprite = new Image();
playerSprite.src = "sprites/tempPlayer.png"

// config, states, global vars
const CONFIG = {
    TILE_SIZE: 16,
    MAP_WIDTH: 32,
    MAP_HEIGHT: 32,
    MOVE_SPEED: 4,
    SCALE: 4
}

// USER STATE
const userState = {
    x: 0,
    y: 0
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
// dictionary
const TILE_TYPE = {
    "GRASS": 0,
    "WATER": 1,
    "BUSH": 2,
    "TREE": 3,
    "WALL": 4
}

const grassSprite = new Image()
const waterSprite = new Image()
grassSprite.src = "sprites/grass.png"
waterSprite.src = "sprites/water.png"

// layer 1 array 
const mapL1 = Array.from({ length: CONFIG.MAP_HEIGHT }, (_, y) =>
    Array.from({ length: CONFIG.MAP_WIDTH }, (_, x) => {
        // The Rule: If we are within 3 tiles of any edge, return WATER
        if (x < 3 || x >= CONFIG.MAP_WIDTH - 3 || y < 3 || y >= CONFIG.MAP_HEIGHT - 3) {
            return TILE_TYPE.WATER;
        }
        // Otherwise, return GRASS
        return TILE_TYPE.GRASS;
    })
);

// CAMERA
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

function update(dt) {
    // update player position here since it runs at a steady 60fps
    const dist = CONFIG.MOVE_SPEED * dt

    // calculate new position
    let newX = userState.x
    let newY = userState.y

    if (keys.w) newY -= dist
    if (keys.s) newY += dist
    if (keys.a) newX -= dist
    if (keys.d) newX += dist

    // bounds
    if (newX < 0) newX = 0
    if (newX > CONFIG.MAP_WIDTH - 1) newX = CONFIG.MAP_WIDTH - 1
    if (newY < 0) newY = 0
    if (newY > CONFIG.MAP_HEIGHT - 1) newY = CONFIG.MAP_HEIGHT - 1

    userState.x = newX
    userState.y = newY

    // camera
    // find center of current frame
    const centerX = (canvas.width / CONFIG.SCALE) / 2
    const centerY = (canvas.height / CONFIG.SCALE) / 2

    // set camera x/y
    camera.x = (userState.x * CONFIG.TILE_SIZE) - centerX + (CONFIG.TILE_SIZE / 2);
    camera.y = (userState.y * CONFIG.TILE_SIZE) - centerY + (CONFIG.TILE_SIZE / 2);

    // A. Stop the camera from going past the Top-Left (0, 0)
    if (camera.x < 0) camera.x = 0;
    if (camera.y < 0) camera.y = 0;

    // B. Stop the camera from going past the Bottom-Right edge
    // Math: Total Map Size (in pixels) minus one screen-full of pixels
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

    // draw map 
    // sprite = null
    // for each id in mapL1,
    // if id === 0, sprite = grassSprite
    // if id === 1, sprite = waterSprite
    // ctx.drawImage(sprite)

    for (let i = 0; i < mapL1.length; i++) {
        for (let j = 0; j < mapL1[i].length; j++) {
            let sprite = null
            let id = mapL1[i][j]

            if (id === TILE_TYPE.GRASS) sprite = grassSprite
            if (id === TILE_TYPE.WATER) sprite = waterSprite

            if (sprite) {
                // Inside your map loop, wrap the X and Y in Math.floor:
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

    // draw player
    // ctx.drawImage(image, dx, dy, dWidth, dHeight)
    // dx (destination x) - horizontal coord where image starts
    // dy (destination y) - vertical coord where image starts
    ctx.drawImage(
        playerSprite,
        (userState.x * CONFIG.TILE_SIZE) - camera.x,
        (userState.y * CONFIG.TILE_SIZE) - camera.y,
        CONFIG.TILE_SIZE,
        CONFIG.TILE_SIZE
    );

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