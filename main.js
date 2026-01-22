const canvas = document.getElementById("gameCanvas")
const ctx = canvas.getContext("2d")


// player sprite
const playerSprite = new Image();
playerSprite.src = "tempPlayer.png"

// config, limits, states, constants etc
const CONFIG = {
    TILE_SIZE: 16,
    MAP_WIDTH: 32,
    MAP_HEIGHT: 32,
    MOVE_SPEED: 4,
    SCALE: 4
}

// user 
const userState = {
    x: 0,
    y: 0
}

// TODO:
// background layer
const L1_TILES = ["GRASS", "WATER"]
// objects
const L2_TILES = ["TREE", "BUSH", "WALL"]


// global variables
let isResizing = false
let resizeTimer = 0
let lastMoveTime = 0;

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
    if (newX > CONFIG.MAP_WIDTH - CONFIG.TILE_SIZE) newX = CONFIG.MAP_WIDTH - CONFIG.TILE_SIZE
    if (newY < 0) newY = 0
    if (newY > CONFIG.MAP_HEIGHT - CONFIG.TILE_SIZE) newY = CONFIG.MAP_HEIGHT - CONFIG.TILE_SIZE

    userState.x = newX
    userState.y = newY
}
function inBounds(key) {
    // get potential position
    // if potential position out of bounds, return false
    // else return true

    let newX = userState.x
    let newY = userState.y

    if (key === "w") newY -= 1
    if (key === "s") newY += 1
    if (key === "a") newX -= 1
    if (key === "d") newX += 1

    if (newX < 0 || newX >= CONFIG.MAP_WIDTH || newY < 0 || newY >= CONFIG.MAP_HEIGHT) {
        return false
    }

    return true
}

function draw() {
    // clear previous frame's pixels
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // ctx.drawImage(image, dx, dy, dWidth, dHeight)
    // dx (destination x) - horizontal coord where image starts
    // dy (destination y) - vertical coord where image starts
    ctx.drawImage(
        playerSprite,
        userState.x * 16,
        userState.y * 16,
        16, 16
    );
}

// key registry (state)
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
}

const validKeys = ["w", "a", "s", "d", "Escape"]

// key logic (movement and pause)
window.addEventListener("keydown", keydownHandle)
window.addEventListener("keyup", keyupHandle)

function keydownHandle(e) {
    // check if e.key is valid key. we want to handle wasd and esc
    const key = e.key
    if (!validKeys.includes(key)) return
    if (key === "Escape") {
        // todo: pause logic
        console.log("Escape")
        return
    }

    // handle each key
    keys[key] = true
    return
}

function keyupHandle(e) {
    keys[e.key] = false
}

// core loop (state -> update -> render)
function gameLoop(timestamp) {
    // perform work and render if not resizing
    if (!isResizing) {
        // calculate dt in seconds and render 
        // dt is the exact amt of time passed btwn previous and curr frame
        const dt = (timestamp - lastMoveTime) / 1000

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


