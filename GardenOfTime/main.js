kaplay({
    background: [0, 0, 0],
    scale: 1
})

const mainColour = [67, 160, 71];
const levelWidth = 3000;
loadFont("pixeled", "assets/fonts/PressStart2P-Regular.ttf")

const starText = add([
    text("Number of Stars Collected = 0/3", {size:25, font:"pixeled"}),
    pos(width()-800, 50),
    color(mainColour),
    fixed()
])

const playerRadius = 16;
const player = add([
    pos(32, height() - 116),
    circle(playerRadius),
    color(mainColour),
    area()
]);

const platforms = [

    // Bottom Platform
    add([
        pos(0, height()-100),
        rect(levelWidth, 100),
        area(),
        color(mainColour),

        "platform",
        {
            myWidth: levelWidth,
            myHeight: 100,
        }
    ]),

    // Any other platforms
    //Test
    add([
        pos(width()/2, height()-150),
        rect(200, 50),
        area(),
        color(mainColour),

        "platform",
        {
            myWidth: 200,
            myHeight: 50,
        }
    ])
];

const collectibles = [

    add([
        pos(300, height()-110),
        circle(10),
        color(mainColour),
        area(),

        "star"
    ]),

    add([
        pos(600, height()-234),
        circle(10),
        color(mainColour),
        area(),

        "star"
    ]),

    add([
        pos(1200, height()-110),
        circle(10),
        color(mainColour),
        area(),

        "star"
    ])
]
let starsCollected = 0;
let shownMessage = false;

//Check collisions with stars
player.onCollide("star", (star) => {
    starsCollected += 1;
    starText.text = `Number of Stars Collected = ${starsCollected}/3`
    destroy(star);
})

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
    player.pos.x = Math.min(Math.max(player.pos.x, 25), levelWidth - 25);

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

        const playerLeft = player.pos.x - playerRadius;
        const playerRight = player.pos.x + playerRadius;
        const playerBottom = player.pos.y + playerRadius;
        const playerTop = player.pos.y - playerRadius;

        const horiLap = playerRight > (pLeft - 2) && playerLeft < (pRight + 2);
        const vertiLap = playerBottom > pTop && playerTop < pBottom;

        if (horiLap && playerBottom > pTop && playerBottom < pTop + 10 && player.velocity.y >= 0){
            player.pos.y = pTop - playerRadius;
            player.velocity.y = 0;
            onAnyPlatform = true;
        }

        if (horiLap && playerTop < pBottom && playerBottom > pBottom && player.velocity.y >= 0){
            player.pos.y = pBottom + playerRadius;
            player.velocity.y = 0;
        }

        if (vertiLap && playerRight > pLeft && playerLeft < pLeft){
            player.pos.x = pLeft - playerRadius;
            player.velocity.x = 0;

        }

        if (vertiLap && playerLeft < pRight && playerRight > pRight){
            player.pos.x = pRight + playerRadius;
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