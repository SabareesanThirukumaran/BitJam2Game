kaplay({
    background: [0, 0, 0],
    scale: 1
})

const levelWidth = 3000;

add([
    text("Hello, Garden of Time!", {size: 24}),
    pos(20, 20),
    color(255, 255, 255)
]);

const playerRadius = 16;
const player = add([
    pos(32, height() - 116),
    circle(playerRadius),
    color(255, 255, 255)
]);

const platforms = [

    // Bottom Platform
    add([
        pos(0, height()-100),
        rect(levelWidth, 100),
        area(),
        color(242, 23, 23),

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
        color(132, 31, 143),

        "platform",
        {
            myWidth: 200,
            myHeight: 50,
        }
    ])

    // Collectibles
];

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