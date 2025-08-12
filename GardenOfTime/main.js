// CONFIGURE KAPLAY
kaplay({
    background: [0, 0, 0],
    scale: 1
});


// CONFIGURING VARIABLES
const mainColour = [67, 160, 71];
const levelWidth = 3008;
const scaleFactor = 4;
const tileSize = 32;
const playerSpeed = 200;
const playerGravity = 980;
const jumpAmount = 600;

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

// LOADING ASSETS
loadFont("pixeled", "assets/fonts/PressStart2P-Regular.ttf");
loadSprite("leaf", "assets/images/LeafSprite.png");
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

const platforms = [

];

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



// Bottom Tiles
for (let i = 0; i < 94; i++){
    for (let y = 0; y < 3; y++){
        // Bottom Ground Platform
        const groundTile = add([
            sprite("ground"),
            pos(32*i, height()-tileSize * (y+1)),
        ]);

    }
}

for (let i = 0; i < 94; i++){
    const topTile = add([
        sprite("topGround"),
        pos(32*i, height()-128),
        area({ collisionIgnore: ["player"]}),
        z(1)
    ])

    platforms.push(topTile)
}

platforms.push(
    add([
        pos(0, height()-128),
        rect(levelWidth, 32),
        area(),
        "platform",
        {
            myWidth: levelWidth,
            myHeight: 32,
        }
    ])
)

const collectibles = [

    add([
        pos(600, height()-234),
        circle(10),
        color(mainColour),
        area(),

        "star"
    ]),

]

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
    pos(96, height() - (128 + spriteSizes[form]["height"] * 4)),
    area({ width: spriteWidth * scaleFactor, height: spriteHeight * scaleFactor }),
    body(),
    scale(scaleFactor),
    anchor("topleft"),

    "player"
]);

function switchForm() {
    form = form === "leaf" ? "flower" : "leaf";
    player.use(sprite(form));
    const newSize = spriteSizes[form];
    player.area.width = newSize.width * scaleFactor;
    player.area.height = newSize.height * scaleFactor;
    player.pos.y = height() - (128 + newSize.height * 4)
    playerWidth = newSize.width * scaleFactor;
    playerHeight = newSize.height * scaleFactor;
}

//Check collisions with stars
player.onCollide("star", (star) => {
    starsCollected += 1;
    starText.text = `Number of Stars Collected = ${starsCollected}/3`
    destroy(star);
})

player.velocity = vec2(0, 0);

onUpdate(() => {

    // Create player moving camera

    const camX = Math.min(Math.max(player.pos.x, visibleWidth / 2), levelWidth - visibleWidth /2);
    const camY = height() / 1.5
    camPos(camX, camY)
    camScale(2)

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

    player.velocity.y += playerGravity * fixedDt;
    player.pos.x += player.velocity.x * fixedDt;
    player.pos.y += player.velocity.y * fixedDt;
    
    for (const platform of platforms){
        const pPos = platform.pos;

        const pLeft = pPos.x;
        const pRight = pLeft + platform.myWidth;
        const pTop = pPos.y;
        const pBottom = pTop + platform.myHeight;

        const playerLeft = player.pos.x;
        const playerRight = player.pos.x + playerWidth;
        const playerBottom = player.pos.y + playerHeight;
        const playerTop = player.pos.y;

        const horiLap = playerRight > (pLeft - 2) && playerLeft < (pRight + 2);
        const vertiLap = playerBottom > pTop && playerTop < pBottom;

        if (horiLap && playerBottom > pTop && playerBottom < pTop + 10 && player.velocity.y >= 0){
            player.pos.y = pTop - playerHeight;
            player.velocity.y = 0;
            onAnyPlatform = true;
        }

        if (horiLap && playerTop < pBottom && playerBottom > pBottom && player.velocity.y >= 0){
            player.pos.y = pBottom
            player.velocity.y = 0;
        }

        if (vertiLap && playerRight > pLeft && playerLeft < pLeft && playerBottom > pTop + 3){
            player.pos.x = pLeft - playerWidth;
            player.velocity.x = 0;

        }

        if (vertiLap && playerLeft < pRight && playerRight > pRight && playerBottom > pTop + 3){
            player.pos.x = pRight;
            player.velocity.x = 0;
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

})

//All Key Presses
onKeyDown("a", () => {
    if (allowMovement) {player.velocity.x = -playerSpeed;}
})

onKeyDown("d", () => {
    if (allowMovement) {player.velocity.x = playerSpeed;}
})

onKeyRelease("a", () => {
    if (allowMovement) {if (player.velocity.x < 0) player.velocity.x = 0;}
})

onKeyRelease("d", () => {
    if (allowMovement) {if (player.velocity.x > 0) player.velocity.x = 0;}
})

onKeyPress("w" , () => {
    if (allowMovement) {
        if (onAnyPlatform) {
            player.velocity.y = -jumpAmount;
        }
    }
})

onKeyPress("e", () => {
    if (removing){return;}

    recreateOverlay()
    removing = true;
    waveY = 0;
    switchForm();
})