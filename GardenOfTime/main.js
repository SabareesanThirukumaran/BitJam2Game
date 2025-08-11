kaplay({
    background: [0, 0, 0],
    scale: 1
})

const mainColour = [67, 160, 71];
const levelWidth = 3008;
loadFont("pixeled", "assets/fonts/PressStart2P-Regular.ttf")

// All Sprites
loadSprite("leaf", "assets/images/LeafSprite.png");
loadSprite("ground", "assets/images/PlatformBSprite.png")
loadSprite("topGround", "assets/images/PlatformTSprite.png")


const starText = add([
    text("Number of Stars Collected = 0/3", {size:25, font:"pixeled"}),
    pos(width()-800, 50),
    color(mainColour),
    fixed()
])

const spriteWidth = 16;
const spriteHeight = 21;
const scaleFactor = 3;

const player = add([
    sprite("leaf"),
    pos(96, height() - 196),
    area({ width: spriteWidth * scaleFactor, height: spriteHeight * scaleFactor }),
    body(),
    scale(scaleFactor),
    anchor("topleft"),

    "player"
]);

const platforms = [

    // Any Level platforms
];

// Bottom Tiles
const tileSize = 32;
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

let starsCollected = 0;
let shownMessage = false;

//Check collisions with stars
player.onCollide("star", (star) => {
    starsCollected += 1;
    starText.text = `Number of Stars Collected = ${starsCollected}/3`
    destroy(star);
})

const playerWidth = spriteWidth * scaleFactor;
const playerHeight = spriteHeight * scaleFactor;
const playerSpeed = 200;
const playerGravity = 980;
const jumpAmount = 600;
player.velocity = vec2(0, 0);
let onAnyPlatform = false;
const fixedDt = 1 / 60

onUpdate(() => {

    // Create player moving camera
    const camX = Math.min(Math.max(player.pos.x, width() / 2), levelWidth - width() / 2);
    const camY = height() / 2
    camPos(camX, camY)

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

})
onKeyDown("a", () => {
    player.velocity.x = -playerSpeed;
})

onKeyDown("d", () => {
    player.velocity.x = playerSpeed;
})

onKeyRelease("a", () => {
    if (player.velocity.x < 0) player.velocity.x = 0;
})

onKeyRelease("d", () => {
    if (player.velocity.x > 0) player.velocity.x = 0;
})

onKeyPress("w" , () => {
    if (onAnyPlatform) {
        player.velocity.y = -jumpAmount;
    }
})