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
let allGrass = [];
let allSpike = [];
let allWeeds = [];
const collectibles = []
let previewPad = null;
let placingPad = false;

let displayedStealth = 0;
let actualStealth  = 0;
let displayedHealth = 1;
let actualHealth = 1;

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

function createPlatform(positionX, BlockWidth, BlockHeight){
    let topHeight = 1;
    let bottomHeight = BlockHeight - topHeight;

    for (let x = 0; x < BlockWidth; x++){
        let tileX = (positionX + x) * 32;

        for (let y = 0 ; y < bottomHeight; y++){
            add([
                sprite("ground"),
                pos(tileX, height()-192-(32*(y+1))),
                z(1)
            ])
        }

        add([
            sprite("topGround"),
            pos(tileX, height()-192-(32*BlockHeight)),
            z(1)
        ])
    }

    platforms.push(add([
        pos(positionX*32, height()-192-(32*BlockHeight)),
        rect(BlockWidth*32, BlockHeight*32),
        area(),
        "platform",
        {myWidth: BlockWidth*32, myHeight: BlockHeight*32}
    ]))

}
createPlatform(10, 4, 5)

function createCollectible(position) {
    const collectibleBlock = add([
        pos(position),
        circle(10),
        color(mainColour),
        area(),
        "star",
    ])
    collectibles.push(collectibleBlock);
}

function createGrass(position) {
    const grassBlock = add([
        sprite("grass"),
        pos(position),
        scale(4),
        area(),
        z(10),
        "grass"
    ])
    allGrass.push(grassBlock);
}

function createSpike(position) {
    const spikeBlock = add([
        sprite("spike"),
        pos(position),
        area(),
        scale(3),
        "spike"
    ])
    allSpike.push(spikeBlock);
}

function createWeed(position) {
    const weedBlock = add([
        sprite("weed"),
        pos(position),
        area(),
        scale(3),
        "weed"
    ])
    allWeeds.push(weedBlock);
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
    pos(96, height() - (192 + spriteSizes[form]["height"] * 4)),
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

function switchForm() {
    if (form == "leaf"){
        form = "flower";
        player.use(sprite(form));
        let newSize = spriteSizes[form];
        player.area.width = newSize.width * scaleFactor;
        player.area.height = newSize.height * scaleFactor;
        player.pos.y = height() - (192 + newSize.height * 4)
        playerWidth = newSize.width * scaleFactor;
        playerHeight = newSize.height * scaleFactor;

        // Zoom out camera to entire level
        camX = levelWidth / 2
        camY = height() / 4.5
        let zoom = width() / levelWidth 
        camPos(camX, camY)
        camScale(zoom)

        // Disable player movement
        playerGravity = 0;
        playerSpeed = 0;

        // Edit Player Position
        previousPosX = player.pos.x;
        previousPosY = player.pos.y;

        const userArea = add([
            rect(50, 100),
            color(255, 255, 255),
            pos(previousPosX, previousPosY+25),
            "userArea"
        ])

        player.pos.x = levelWidth - 500;
        player.pos.y = height() - 1200;
        player.use(scale(15));

        arrow = add([
            rect(25, 25),
            color(mainColour),
            anchor("left"), // so it grows rightwards from player position
            z(5),
            "arrow"
        ]);

        startPlacingJumpPad();

    }
    else if (form == "flower"){
        form = "leaf";
        player.use(sprite(form));
        let newSize = spriteSizes[form];
        player.area.width = newSize.width * scaleFactor;
        player.area.height = newSize.height * scaleFactor;
        player.pos.y = height() - (192 + newSize.height * 4);
        playerWidth = newSize.width * scaleFactor;
        playerHeight = newSize.height * scaleFactor;

        destroyAll("jumpPadPreview");
        destroyAll("arrow");
        destroyAll("userArea");

        playerGravity = 980;
        playerSpeed = 200;

        player.pos.x = previousPosX;
        player.pos.y = previousPosY;
        player.use(scale(scaleFactor));

        placingPad = false;
    }


}

player.onCollide("star", (star) => {
    starsCollected += 1;
    starText.text = `Number of Stars Collected = ${starsCollected}/3`
    destroy(star);
})
player.onCollide("grass", () => {actualStealth = 1;})
player.onCollide("weed", () => {actualStealth = 0.4;})
player.onCollideEnd("grass", () => {actualStealth = 0;})
player.onCollideEnd("weed", () => {actualStealth = 0;})
player.onCollide("spike", () => {actualHealth -= (1/3);})

onUpdate(() => {

    // Create player moving camera
    if (form == "leaf"){
        let camX = Math.min(Math.max(player.pos.x, visibleWidth / 2), levelWidth - visibleWidth /2);
        let camY = height() / 1.7
        camPos(camX, camY)
        camScale(2)
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

    // Check to see if player is not inside the screen
    player.pos.x = Math.min(Math.max(player.pos.x, 10), levelWidth - 40);
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