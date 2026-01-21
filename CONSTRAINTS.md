# v1 Constraints – WASD Cat

This document defines **locked constraints** for v1 of the project.
Any changes require an intentional update to this file.

---

## Rendering

- Renderer: Canvas 2D
- Canvas size: Fullscreen (window.innerWidth / window.innerHeight)
- Image smoothing: Disabled (pixel-perfect rendering)
- Render loop: state → render (no direct DOM mutation)

## Tiles & World

- Logical tile size: 16×16
- Render scale: 2× (tiles render as 32×32 on screen)
- Map size (v1): 64×64 tiles
- Map storage: number[][] for terrain + entity list for objects/items
- World bounds: solid (player cannot leave map)

## Camera

- Camera mode: Player-centered
- Camera clamping: Enabled (stops at world edges)
- Viewport size: Derived from canvas size

## Movement & Input

- Movement style: Grid-based, one tile per keypress
- Input: WASD + arrow keys
- Diagonal movement: Enabled
- Movement updates state only (no per-pixel interpolation)

## Collision & Interaction

- Collision: Walls + solid objects block movement
- Interaction trigger: Collision attempt or adjacency check
- First interaction effect: Brief visual offset (“wiggle”)

## Items & Inventory

- Items are entities placed in the world
- Item pickup: Triggered by stepping onto item tile
- Inventory model: Simple counts (key → number)
- Collected items are removed from the world

## Save / Load

- Persistence: localStorage
- Saved data (v1): Player position, inventory, collected item IDs
- Save timing: After movement and item pickup

## Art Scope (v1)

- Art style: Pixel art
- Player sprite: Single idle sprite (walking animation optional)
- Tileset size: Minimal (floor, wall, bush, item, player)
- No advanced animation systems (no skeletal or vector animation)
