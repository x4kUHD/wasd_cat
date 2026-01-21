const canvas = document.getElementById("gameCanvas")
const ctx = canvas.getContext("2d")

// global var for resize state
let isResizing = false
let resizeTimer = 0

// handle resize
function resizeHandle() {
    // 1. enter resizing mode
    isResizing = true
    canvas.classList.add("blur-mode");

    // 2. cancel previous timer
    clearTimeout(resizeTimer)

    // 3. start new countdown (AFTER user stops dragging)
    resizeTimer = setTimeout(() => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        // re-disbale smoothing since change width height resets context
        ctx.imageSmoothingEnabled = false

        // exit resizing mode
        isResizing = false
        canvas.classList.remove("blur-mode")
        console.log(`resized to: ${canvas.width}x${canvas.height}`)
    }, 200)
}

window.addEventListener("resize", resizeHandle)

