// CONFIGURE KAPLAY
kaplay({
    background: [0, 0, 0],
    scale: 1
});

// CONFIGURING VARIABLES
const mainColour = [67, 160, 71];
const levelWidth = 3008;
let scaleFactor = 4;
const tileSize = 32;
let playerSpeed = 200;
let playerGravity = 980;
const jumpAmount = 600;
let playerState = "idle";
let previousPosX = 0;
let previousPosY  = 0;

let starsCollected = 0;
let shownMessage = false;

let onAnyPlatform = false;
const fixedDt = 1 / 60
const visibleWidth = width() / 2;

let cells = [];
let offsets = [];
let removing = false;
let waveY = 0;
const cellSize = 16;
const waveSpeed = 2000;
let allowMovement = true;

const arrowOffsetY = 150;
let arrow;

let jumpPads = [];
const collectibles = []
let previewPad = null;
let placingPad = false;

let displayedStealth = 0;
let actualStealth  = 0;
let displayedHealth = 1;
let actualHealth = 1;
let grassOverlapCount = 0;
let weedOverlapCount = 0;

// LOADING ASSETS
loadFont("pixeled", "assets/fonts/PressStart2P-Regular.ttf");
loadSprite("leaf", "assets/images/LeafSprite.png", {
    sliceX: 4,
    anims: {
        idle: {
            from: 0,
            to: 3,
            speed: 6,
            loop: true
        }
    }
});
loadSprite("movingLeaf", "assets/images/LeafMoveSprite.png");
loadSprite("jumpPad", "assets/images/PadSprite.png");
loadSprite("grass", "assets/images/GrassSprite.png");
loadSprite("spike", "assets/images/SpikeSprite.png");
loadSprite("weed", "assets/images/WeedsSprite.png");
loadSprite("flower", "assets/images/FlowerSprite.png");
loadSprite("ground", "assets/images/PlatformBSprite.png");
loadSprite("topGround", "assets/images/PlatformTSprite.png");

// ALL OF UI
const starText = add([
    text("Number of Stars Collected = 0/3", {size:25, font:"pixeled"}),
    pos(width()-800, 50),
    color(mainColour),
    fixed()
])

function createText(textInfo, textSize, positionX, positionY){
    add([
        text(`${textInfo}`, {size:textSize, font:"pixeled"}),
        pos(positionX*32, positionY*32),
        color(mainColour)
    ])
}

const platforms = [];

function recreateOverlay(){

    for (let c of cells){
        if (c && c.exists) {destroy(c)};
    }
    cells = [];
    offsets = [];

    const cols = Math.ceil(width() / cellSize);
    const rows = Math.ceil(height() / cellSize);

    for (let col = 0; col < cols; col++){

        offsets[col] = Math.round(rand(-2, 2)) * cellSize;

        const x = col * cellSize;
        for (let row = 0; row < rows; row++){
            const y = row * cellSize
            const cell = add([
                pos(x, y),
                rect(cellSize, cellSize),
                color(mainColour),
                fixed(),
                z(999),
                "transitionCell",
                {columnIndex: col, rowY: y}
            ])

            cells.push(cell)
        }
    }
}

// DO NOT EDIT, BOTTOM TILES
for (let i = 0; i < 94; i++){
    for (let y = 0; y < 5; y++){
        add([
            sprite("ground"),
            pos(32*i, height()-tileSize * (y+1)),
        ]);

    }
}

// DO NOT EDIT, TOP LAYER OF GROUND
for (let i = 0; i < 94; i++){
    add([
        sprite("topGround"),
        pos(32*i, height()-192),
        area({ collisionIgnore: ["player"]}),
        z(1)
    ])
}

platforms.push(
    add([
        pos(0, height()-192),
        rect(levelWidth, 10),
        area(),
        "platform",
        {
            myWidth: levelWidth,
            myHeight: 10,
        }
    ])
)

function createPlatform(positionX, BlockWidth, BlockHeight, positionY=null){
    let topHeight = 1;

    if (!positionY){
        let bottomHeight = BlockHeight - topHeight;

        for (let x = 0; x < BlockWidth; x++){
            let tileX = (positionX + x) * 32;

            for (let y = 0 ; y < bottomHeight; y++){
                add([
                    sprite("ground"),
                    pos(tileX, height()-192-(32*(y+1))),
                    z(1),
                    "createdPlatform"
                ])
            }

            add([
                sprite("topGround"),
                pos(tileX, height()-192-(32*BlockHeight)),
                z(1),
                "createdPlatform"
            ])
        }

        platforms.push(add([
            pos(positionX*32, height()-192-(32*BlockHeight)),
            rect(BlockWidth*32, BlockHeight*32),
            area(),
            "platform",
            {myWidth: BlockWidth*32, myHeight: BlockHeight*32},
            "createdPlatform"
        ]))
    } else {
        for (let x = 0; x < BlockWidth; x++){
            let tileX = (positionX + x) * 32
            add([
                sprite("topGround"),
                pos(tileX, height() - 192 - (32*positionY)),
                z(1),
                "createdPlatform"
            ])
        }

        platforms.push(add([
            pos(positionX*32, height() - 192 - (32*positionY)),
            rect(BlockWidth*32, 32),
            area(),
            "platform",
            {myWidth: BlockWidth*32, myHeight: 32},
            "createdPlatform"
        ]))
    }

}

function createCollectible(positionX, positionY) {
    const collectibleBlock = add([
        pos(positionX*32, height()-192-(positionY*32)),
        circle(10),
        color(mainColour),
        area(),
        "star",
    ])
    collectibles.push(collectibleBlock);
}

const TILE = 32;
const GROUND_TOP = height() - 192; 
const tileTopY = (row) => GROUND_TOP - row * TILE;
const colliderGrids = { grass: {}, spike: {}, weed: {} };
function addColliderSpan(type, startX, endX, y, heightPx, bottomOffsetPx = 0) {
  const widthPx = (endX - startX + 1) * TILE;
  const node = add([
    pos(startX * TILE, tileTopY(y) + bottomOffsetPx),
    rect(widthPx, heightPx),
    anchor("botleft"),
    area(),
    opacity(0),
    type,
    { startX, endX, y, bottomOffsetPx, heightPx },
  ]);
  for (let x = startX; x <= endX; x++) {
    colliderGrids[type][`${x},${y}`] = node;
  }
  return node;
}
function mergeOrAdd(type, x, y, heightPx, bottomOffsetPx = 0) {
  const grid = colliderGrids[type];
  const left = grid[`${x - 1},${y}`];
  if (left &&
      left.y === y &&
      left.bottomOffsetPx === bottomOffsetPx &&
      left.heightPx === heightPx) {

    const startX = left.startX;
    destroy(left);
    return addColliderSpan(type, startX, x, y, heightPx, bottomOffsetPx);
  }
  return addColliderSpan(type, x, x, y, heightPx, bottomOffsetPx);
}

function createGrass(x, y) {
  add([
    sprite("grass"),
    pos(x * TILE, tileTopY(y)+32),
    anchor("botleft"),
    scale(4),
    z(10),
  ]);
  mergeOrAdd("grass", x, y, 16, 0);
}

function createSpike(x, y) {
  add([
    sprite("spike"),
    pos(x * TILE, tileTopY(y)+32),
    anchor("botleft"),
    scale(3),
  ]);
  mergeOrAdd("spike", x, y, 12, 0);
}

function createWeed(x, y) {
  add([
    sprite("weed"),
    pos(x * TILE, tileTopY(y) - 16+64),
    anchor("botleft"),
    scale(3),
  ]);
  mergeOrAdd("weed", x, y, 32, -16);
}

// STEALTH BAR
const stealthBarText = add([text("Stealth :", {size:25, font:"pixeled"}), pos(50, 70), color(mainColour), fixed()])
const stealthBarBg = add([rect(420, 60), pos(300,50), color(mainColour), fixed(), z(100)]);
const stealthBar = add([rect(400, 50), pos(310, 55), color(0, 0, 0), fixed(), z(101)]);
const stealthBarInner = add([rect(400, 50), pos(310, 55), color(mainColour), outline(4), fixed(), z(101)])

// HEALTH BAR
const healthBarText = add([text("Health :", {size:25, font:"pixeled"}), pos(50, 140), color(mainColour), fixed()])
const healthBarBg = add([rect(420, 60), pos(300,120), color(mainColour), fixed(), z(100)]);
const healthBar = add([rect(400, 50), pos(310, 125), color(0, 0, 0), fixed(), z(101)]);
const healthBarInner = add([rect(400, 50), pos(310, 125), color(mainColour), outline(4), fixed(), z(101)])

// PLAYER SETUP
let form = "leaf";
let spriteSizes = {
    "leaf": {"width": 16, "height": 21},
    "flower": {"width": 19, "height": 28}
}

let spriteWidth = spriteSizes[form]["width"];
let spriteHeight = spriteSizes[form]["height"];

let playerWidth = spriteWidth * scaleFactor;
let playerHeight = spriteHeight * scaleFactor;

const player = add([
    sprite("leaf"),
    pos(32, height() - (192 + spriteSizes[form]["height"] * 4)),
    area({ width: spriteWidth * scaleFactor, height: spriteHeight * scaleFactor }),
    body(),
    scale(scaleFactor),
    anchor("topleft"),

    "player"
]);
player.play("idle")
player.velocity = vec2(0, 0);

function overlapping(a, b, tolerance = 10){
    const aLeft = a.pos.x;
    const aRight = a.pos.x + (a.Padwidth || a.width);
    const aBottom = a.pos.y + (a.Padheight || a.height);

    const bLeft = b.pos.x;
    const bRight = b.pos.x + (b.myWidth || b.width);
    const bTop = b.pos.y;

    const horiPlatLap = aRight > bLeft && aLeft < bRight
    const vertiPlatLap = Math.abs(aBottom - bTop) <= tolerance
    return horiPlatLap && vertiPlatLap;
}

function playerOnPad(player, pad, tolerance = 3) {
    const pLeft   = player.pos.x;
    const pRight  = pLeft + playerWidth;
    const pTop    = player.pos.y;
    const pBottom = pTop + playerHeight;

    const padLeft   = pad.pos.x;
    const padRight  = padLeft + (pad.Padwidth || pad.width);
    const padTop    = pad.pos.y;

    const horizontal = pRight > padLeft && pLeft < padRight;
    const comingDown = player.velocity.y >= 0;

    const alignedOnTop = Math.abs(pBottom - padTop) <= tolerance && pTop < padTop;
    return horizontal && alignedOnTop && comingDown;
}

function startPlacingJumpPad(){
    placingPad = true;
    previewPad = add([
        sprite("jumpPad"),
        pos(vec2(0, 0)),
        anchor("topleft"),
        z(6),
        "jumpPadPreview",
        {Padwidth: 100, Padheight: 15}
    ])
}

function placeJumpPad(position){
    const pad  = add([
        sprite("jumpPad"),
        pos(position),
        anchor("topleft"),
        area(),
        body({isStatic: true}),
        z(6),
        "jumpPad",
        {Padwidth: 100, Padheight: 15}
    ])
    jumpPads.push(pad);
}

let returnAnchor = null;

function getSupportingPlatform(tol = 6) {
    const pLeft   = player.pos.x;
    const pRight  = pLeft + playerWidth;
    const pBottom = player.pos.y + playerHeight;

    for (const platform of platforms) {
        const left  = platform.pos.x;
        const right = left + platform.myWidth;
        const top   = platform.pos.y;

        const overlapX = pRight > left && pLeft < right;
        const onTop    = Math.abs(pBottom - top) <= tol;
        if (overlapX && onTop) return platform;
    }
    return null;
}

function saveReturnAnchor() {
    previousPosX = player.pos.x;
    previousPosY = player.pos.y;

    const plat = getSupportingPlatform();
    if (plat) {
        returnAnchor = { type: "top", x: player.pos.x, topY: plat.pos.y };
    } else {
        returnAnchor = { type: "free", x: player.pos.x, y: player.pos.y };
    }
}

function restoreFromReturnAnchor() {
    if (!returnAnchor) {
        player.pos.x = previousPosX;
        player.pos.y = previousPosY;
        return;
    }

    if (returnAnchor.type === "top") {
        player.pos.x = returnAnchor.x;
        player.pos.y = returnAnchor.topY - playerHeight;
        player.velocity.y = 0;
    } else {
        player.pos.x = returnAnchor.x;
        player.pos.y = returnAnchor.y;
    }
}

function switchForm() {
    if (form === "leaf") {
        // SAVE FIRST (on-platform info + exact XY)
        saveReturnAnchor();

        // Switch to flower (do NOT touch pos.y baseline)
        form = "flower";
        player.use(sprite(form));

        let newSize = spriteSizes[form];
        player.area.width  = newSize.width  * scaleFactor;
        player.area.height = newSize.height * scaleFactor;
        playerWidth  = newSize.width  * scaleFactor;
        playerHeight = newSize.height * scaleFactor;

        // Freeze physics completely in flower mode
        player.velocity = vec2(0, 0);
        playerGravity = 0;
        playerSpeed = 0;

        // Camera zoom-out + teleport to placement view (your existing values)
        let camX = levelWidth / 2;
        let camY = height() / 4.5;
        let zoom = width() / levelWidth;
        camPos(camX, camY);
        camScale(zoom);

        // (Your UI)
        const userArea = add([
            rect(50, 100),
            color(255, 255, 255),
            pos(previousPosX, previousPosY + 25),
            "userArea",
        ]);

        player.pos.x = levelWidth - 500;
        player.pos.y = height() - 1200;
        player.use(scale(15));

        arrow = add([ rect(25, 25), color(mainColour), anchor("left"), z(5), "arrow" ]);
        startPlacingJumpPad();

    } else {
        form = "leaf";
        player.use(sprite(form));

        let newSize = spriteSizes[form];
        player.area.width  = newSize.width  * scaleFactor;
        player.area.height = newSize.height * scaleFactor;
        playerWidth  = newSize.width  * scaleFactor;
        playerHeight = newSize.height * scaleFactor;
        player.use(scale(scaleFactor));

        destroyAll("jumpPadPreview");
        destroyAll("arrow");
        destroyAll("userArea");

        // Re-enable physics & clear any residual motion
        playerGravity = 980;
        playerSpeed = 200;
        player.velocity = vec2(0, 0);

        // RESTORE to the saved anchor (top of platform or free space)
        restoreFromReturnAnchor();

        placingPad = false;
    }
}


player.onCollide("star", (star) => {
    starsCollected += 1;
    starText.text = `Number of Stars Collected = ${starsCollected}/3`
    destroy(star);
})
player.onCollide("grass", () => {grassOverlapCount++; actualStealth = 1;})
player.onCollide("weed", () => {weedOverlapCount++; actualStealth = 0.4; playerSpeed=100;})
player.onCollideEnd("grass", () => {grassOverlapCount = Math.max(0, grassOverlapCount - 1); if(grassOverlapCount === 0) {actualStealth = 0;}})
player.onCollideEnd("weed", () => {weedOverlapCount = Math.max(0, weedOverlapCount-1); if(weedOverlapCount === 0){actualStealth = 0; playerSpeed=200;}})
player.onCollide("spike", () => {actualHealth -= (1/3);})

onUpdate(() => {

    // Create player moving camera
    if (form == "leaf"){
        let camX = Math.min(
            Math.max(player.pos.x, visibleWidth / 2),
            levelWidth - visibleWidth / 2
        );

        // Your normal locked cam position
        let defaultCamY = height() / 1.7;
        
        // Camera's top visible edge (taking scale into account)
        let topVisibleY = defaultCamY - (height() / (2 * 2)); // half screen height / scale

        let camY = defaultCamY;

        // Only move camera if player is off the top of the screen
        if (player.pos.y < topVisibleY) {
            camY = player.pos.y + (height() / (2 * 2));
        }

        camPos(camX, camY);
        camScale(2);
    }

    if (form == "flower" && placingPad && previewPad) {
        const playerCenter = vec2(player.pos.x, player.pos.y + arrowOffsetY);
        const mouseWorld = toWorld(mousePos());
        const dir = mouseWorld.sub(playerCenter);
        const dist = dir.len();
        const tipPosition = playerCenter.add(dir);
        const offsetPos = tipPosition.add(vec2(Math.cos(arrow.angle), Math.sin(arrow.angle)).scale(15))
        
        arrow.angle = dir.angle();
        arrow.width = dist;
        arrow.pos = playerCenter;

        previewPad.pos = offsetPos;
        let colliding = false;

        for (const platform of platforms) {
            if (overlapping(previewPad, platform)){
                colliding = true;
                break;
            }
        }
        previewPad.use(outline(10, colliding ? [0, 255, 0] : [255, 0, 0]))

    }

    for (const pad of jumpPads){
        if (playerOnPad(player, pad)){
            player.pos.y = pad.pos.y - playerHeight;
            player.velocity.y = -jumpAmount * 1.5;
        }
    }
    // Do level finish message text
    if (starsCollected == 3 && !shownMessage){
        const endMessage = add([
            text("Reach the end to go to the next level!",{size:15, font:"pixeled"}),
            pos(0, 0),
            fixed(),
            color(mainColour),
        ])

        endMessage.pos.x = (width() - endMessage.width) / 2
        endMessage.pos.y = 200;
        shownMessage = true;
    }

    if (form === "leaf"){
        onAnyPlatform = false;
        const dt = fixedDt;
        player.velocity.y += playerGravity * dt;
        let dx = player.velocity.x * dt;
        let dy = player.velocity.y * dt;
        const pWidth  = playerWidth;
        const pHeight = playerHeight;

        (function sweepVertical() {
            if (dy === 0) return;
            const curLeft  = player.pos.x;
            const curRight = curLeft + pWidth;
            for (const platform of platforms) {
                const pLeft   = platform.pos.x;
                const pRight  = pLeft + platform.myWidth;
                if (curRight <= pLeft || curLeft >= pRight) continue;

                const pTop    = platform.pos.y;
                const pBottom = pTop + platform.myHeight;

                if (dy > 0) {
                    const curBottom  = player.pos.y + pHeight;
                    const nextBottom = curBottom + dy;
                    if (curBottom <= pTop && nextBottom >= pTop) {
                        player.pos.y = pTop - pHeight;
                        player.velocity.y = 0;
                        dy = 0;
                        onAnyPlatform = true;
                        return;
                    }
                } else {
                    const curTop  = player.pos.y;
                    const nextTop = curTop + dy;
                    if (curTop >= pBottom && nextTop <= pBottom) {
                        player.pos.y = pBottom;
                        player.velocity.y = 0;
                        dy = 0;
                        return;
                    }
                }
            }
            player.pos.y += dy;
        })();
        (function sweepHorizontal() {
            if (dx === 0) return;
            const curTop    = player.pos.y;
            const curBottom = curTop + pHeight;

            for (const platform of platforms) {
                const pTop    = platform.pos.y;
                const pBottom = pTop + platform.myHeight;
                if (curBottom <= pTop || curTop >= pBottom) continue;

                const pLeft   = platform.pos.x;
                const pRight  = pLeft + platform.myWidth;

                if (dx > 0) {
                    const curRight  = player.pos.x + pWidth;
                    const nextRight = curRight + dx;
                    if (curRight <= pLeft && nextRight >= pLeft) {
                        player.pos.x = pLeft - pWidth;
                        player.velocity.x = 0;
                        dx = 0;
                        return;
                    }
                } else {
                    const curLeft  = player.pos.x;
                    const nextLeft = curLeft + dx;
                    if (curLeft >= pRight && nextLeft <= pRight) {
                        player.pos.x = pRight;
                        player.velocity.x = 0;
                        dx = 0;
                        return;
                    }
                }
            }
            player.pos.x += dx;
        })();

        player.pos.x = Math.min(Math.max(player.pos.x, 10), levelWidth - 40);
    }

    if (form == "leaf"){
        if (player.velocity.x === 0 && onAnyPlatform && playerState !== "idle") {
            player.use(sprite("leaf"));
            player.play("idle");
            playerState = "idle";
        } 

        if (!(player.velocity.x === 0 && onAnyPlatform) && playerState !== "moving"){
            player.use(sprite("movingLeaf"));
            playerState = "moving"
        }
    } 

    if (removing) {
        allowMovement = false;
        for (let i = cells.length - 1; i >= 0; i--) {
            const cell = cells[i];
            const offset = offsets[cell.columnIndex] || 0;
            if (cell.rowY <= waveY - offset) {
                destroy(cell);
                cells.splice(i, 1);
            }
        }

        waveY += waveSpeed * fixedDt;

        if (cells.length === 0) {
            removing = false;
            allowMovement = true;
        }
    }

    const barSpeed = 3;
    displayedStealth += (actualStealth - displayedStealth) * barSpeed * fixedDt;
    displayedHealth += (actualHealth - displayedHealth) * barSpeed * fixedDt;
    stealthBarInner.width = 400 * displayedStealth;
    healthBarInner.width = 400 * displayedHealth;

})

//All Key Presses
onKeyDown("a", () => { if (allowMovement) {player.velocity.x = -playerSpeed;}})
onKeyDown("d", () => { if (allowMovement) {player.velocity.x = playerSpeed;} })
onKeyRelease("a", () => { if (allowMovement) {if (player.velocity.x < 0) player.velocity.x = 0;}})
onKeyRelease("d", () => { if (allowMovement) {if (player.velocity.x > 0) player.velocity.x = 0;} })
onKeyPress("w" , () => { if (allowMovement) { if (onAnyPlatform) { player.velocity.y = -jumpAmount; }}})
onKeyPress("e", () => {
    if (removing){return;}
    recreateOverlay()
    removing = true;
    waveY = 0;
    switchForm();
})
onKeyPress("space", () => {
    if (form === "flower" && placingPad && previewPad) {
        let colliding = false;
        for (const platform of platforms) {
            if (overlapping(previewPad, platform)) {
                colliding = true;
                break;
            }
        }
        if (colliding) {
            placeJumpPad(previewPad.pos.clone());
            destroy(previewPad);
            previewPad = null;
            placingPad = false;
            switchForm();
        }
    }
});

//LOADING LEVELS
import tutorial from "./levels/tutorial.js"

function loadLevel(levelData) {
    destroyAll("createdPlatform")
    destroyAll("star")
    destroyAll("spike")
    destroyAll("grass")
    destroyAll("weed")

    for (const p of levelData.platforms) {createPlatform(p.posX, p.BlockW, p.BlockH, p.posY)}
    for (const c of levelData.collectiblesForm) {createCollectible(c.posX, c.posY)}
    for (const h of levelData.hazards) {
        if (h.type == "grass") {createGrass(h.posX, h.posY)}
        if (h.type == "spike") {createSpike(h.posX, h.posY)}
        if (h.type == "weed") {createWeed(h.posX, h.posY)}
    }
    for (const t of levelData.texts) {createText(t.textInfo, t.textSize, t.posX, t.posY)}
}

loadLevel(tutorial)