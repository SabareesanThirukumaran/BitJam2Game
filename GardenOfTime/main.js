// CONFIGURE KAPLAY
kaplay({
    background: [0, 0, 0],
    scale: 1,
    pixelArt: true
});

// LOADING ASSETS
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
loadSprite("orbAnim", "assets/images/Animation.png", {
    sliceX: 12,
    anims: {
        fly:{
            from: 0,
            to: 11,
            speed: 4,
            loop: false
        }
    }
})
loadSprite("movingLeaf", "assets/images/LeafMoveSprite.png");
loadSprite("jumpPad", "assets/images/PadSprite.png");
loadSprite("grass", "assets/images/GrassSprite.png");
loadSprite("spike", "assets/images/SpikeSprite.png");
loadSprite("weed", "assets/images/WeedsSprite.png");
loadSprite("flower", "assets/images/FlowerSprite.png");
loadSprite("ground", "assets/images/PlatformBSprite.png");
loadSprite("topGround", "assets/images/PlatformTSprite.png");
loadSprite("mainMenuBG", "assets/images/MainMenuBackground.png")
loadFont("pixeled", "assets/fonts/PressStart2P-Regular.ttf");
const mainColour = [67, 160, 71];
import tutorial from "./levels/tutorial.js"

function transitionScenes(sceneTo, parameters, duration=0.5){
    const overlay = add([
        rect(width(), height()),
        color(0, 0, 0),
        opacity(0),
        z(999),
        fixed()
    ])

    tween(0, 1, duration, (overlaying) => overlay.opacity = overlaying, easings.linear)
        .then(() => {
            go(sceneTo, {level: parameters.level});

            const newOverlay = add([
                rect(width(), height()),
                color(0, 0, 0),
                opacity(1),
                fixed(),
                z(999),
            ]);
            tween(1, 0, duration, (overlaying) => newOverlay.opacity = overlaying, easings.linear)
        })
}

scene("mainMenu", () => {
    const baseWidth = 320;
    const baseHeight = 180;

    const mainScaleFactor = Math.floor(Math.min(width() / baseWidth, height() / baseHeight));

    add([
        sprite("mainMenuBG"),
        pos((width() - baseWidth * mainScaleFactor) / 2, (height() - baseHeight * mainScaleFactor) / 2),
        anchor("topleft"),
        scale(mainScaleFactor)
    ]);

    add([
        text("Garden of Time", {size: 55, font:"pixeled"}),
        pos(width() / 2.25, height() / 4),
        anchor("center"),
        color(mainColour),
    ])

    add([
        text("Press ENTER to Play", {size: 30, font:"pixeled"}),
        pos(width() / 2, height() / 1.075),
        anchor("center"),
        color(0, 0, 0)
    ])

    onKeyPress("enter", () => {
        transitionScenes("levelSelect", {})
    })
})

scene("levelSelect", () => {
    add([
        text("Select a Level", {size: 55, font: "pixeled"}),
        pos(width()/2, height()/5),
        anchor("center"),
        color(mainColour)
    ])

    const tutorialButtonBG = add([
        rect(300, 100),
        pos(width() / 2, height() / 2.25),
        anchor("center"),
        color(mainColour),
        outline(10, mainColour),
        area(),
        "tutorial"
    ])

    const tutorialButton = add([
        text("Tutorial", {size: 24, font:"pixeled"}),
        pos(width()/2, height()/2.25),
        anchor("center"),
        color(0, 0, 0),
        z(2),
        area(),
        "tutorial"
    ])

    onHover("tutorial", () => {
        setCursor("pointer")
    })

    onHoverEnd("tutorial", () => [
        setCursor("default")
    ])

    onClick("tutorial", () => {
        go("game", {level: tutorial})
    })
})

scene("game", ({level}) => {
    // CONFIGURING VARIABLES
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

    let returnAnchor = null;

    const TILE = 32;
    const GROUND_TOP = height() - 192; 
    const tileTopY = (row) => GROUND_TOP - row * TILE;
    const colliderGrids = { grass: {}, spike: {}, weed: {} };
    const starText = add([
        text("Number of Stars Collected = 0/3", {size:25, font:"pixeled"}),
        pos(width()-800, 50),
        color(mainColour),
        fixed()
    ])
    const platforms = [];
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

    function createText(textInfo, textSize, positionX, positionY){
        add([
            text(`${textInfo}`, {size:textSize, font:"pixeled", width:500}),
            pos(positionX, positionY),
            color(mainColour),
            z(10)
        ])
    }

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
            for (let row = 0; row < rows; row++){
                const cell = add([ pos(col * cellSize, row * cellSize), rect(cellSize, cellSize), color(mainColour), fixed(), z(999), "transitionCell", {columnIndex: col, rowY: row * cellSize} ]);
                cells.push(cell);
            }
        }

    }

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

    function flashWhite(duration = 0.1) {
        add([
            rect(width(), height()),
            color(255, 255, 255),
            opacity(1), // Needed for lifespan fade
            fixed(),
            z(999),
            lifespan(duration, { fade: 0.1 })
        ]);
    }

    function launchOrbArc(startPos, targetPos) {
        flashWhite();
        const orb = add([
            sprite("orbAnim"),
            pos(startPos),
            z(50),
        ]);
        orb.play("fly");

        const travelTime = 2.5;
        const peakHeight = -80;
        const startX = startPos.x;
        const startY = startPos.y;
        const targetX = targetPos.x;
        const targetY = targetPos.y;
        const deltaX = targetX - startX;
        const deltaY = targetY - startY;
        const pi = Math.PI;
        let elapsed = 0;

        camScale(1.5);
        camPos(startPos);

        orb.onUpdate(() => {
            elapsed += dt();
            let t = elapsed / travelTime;
            if (t >= 1) {
                orb.pos.x = targetX;
                orb.pos.y = targetY;
                camPos(orb.pos);
                endOrbSequence(orb, targetPos);
                return;
            }

            const x = startX + deltaX * t;
            const y = startY + deltaY * t + peakHeight * Math.sin(pi * t);
            orb.pos.x = x;
            orb.pos.y = y;
            camPos(x, y);
        });
    }

    function endOrbSequence(orb, finalPos) {
        flashWhite();
        destroy(orb);

        camScale(1);
        camPos(player.pos);

        placeJumpPad(finalPos);
        switchForm("leaf");
    }

    function getNearbyPlatforms(playerX) {
        return platforms.filter(p => Math.abs(p.pos.x - playerX) < 500); // Only nearby platforms
    }

    function getSupportingPlatform(tol = 6) {
        const pLeft = player.pos.x, pRight = pLeft + playerWidth, pBottom = player.pos.y + playerHeight;
        for (const platform of getNearbyPlatforms(player.pos.x)) {
            const left = platform.pos.x, right = left + platform.myWidth, top = platform.pos.y;
            if (pRight > left && pLeft < right && Math.abs(pBottom - top) <= tol) return platform;
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
            saveReturnAnchor();

            form = "flower";
            player.use(sprite(form));

            let newSize = spriteSizes[form];
            player.area.width  = newSize.width  * scaleFactor;
            player.area.height = newSize.height * scaleFactor;
            playerWidth  = newSize.width  * scaleFactor;
            playerHeight = newSize.height * scaleFactor;

            player.velocity = vec2(0, 0);
            playerGravity = 0;
            playerSpeed = 0;

            let camX = levelWidth / 2;
            let camY = height() / 12;
            let zoom = width() / (levelWidth / 1.05);
            camPos(camX, camY);
            camScale(zoom);

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

            playerGravity = 980;
            playerSpeed = 200;
            player.velocity = vec2(0, 0);

            restoreFromReturnAnchor();

            placingPad = false;
        }
    }

    player.onCollide("star", (star) => {starsCollected += 1;starText.text = `Number of Stars Collected = ${starsCollected}/3`; destroy(star);})
    player.onCollide("grass", () => {grassOverlapCount++; actualStealth = 1;})
    player.onCollide("weed", () => {weedOverlapCount++; actualStealth = 0.4; playerSpeed=100;})
    player.onCollideEnd("grass", () => {grassOverlapCount = Math.max(0, grassOverlapCount - 1); if(grassOverlapCount === 0) {actualStealth = 0;}})
    player.onCollideEnd("weed", () => {weedOverlapCount = Math.max(0, weedOverlapCount-1); if(weedOverlapCount === 0){actualStealth = 0; playerSpeed=200;}})
    player.onCollide("spike", () => {actualHealth -= (1/3);})
    player.onCollide("jumpPad", (pad) => {
        player.pos.y = pad.pos.y - playerHeight;
        player.velocity.y = -jumpAmount * 1.5;
    });

    onUpdate(() => {

        if (form == "leaf"){
            let camX = Math.min(
                Math.max(player.pos.x, visibleWidth / 2),
                levelWidth - visibleWidth / 2
            );

            // Your normal locked cam position
            let defaultCamY = height() / 1.75;
            
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

            waveY += 10000 * fixedDt;

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

    onKeyDown("a", () => { if (allowMovement) {player.velocity.x = -playerSpeed;}})
    onKeyDown("d", () => { if (allowMovement) {player.velocity.x = playerSpeed;} })
    onKeyRelease("a", () => { if (allowMovement) {if (player.velocity.x < 0) player.velocity.x = 0;}})
    onKeyRelease("d", () => { if (allowMovement) {if (player.velocity.x > 0) player.velocity.x = 0;} })
    onKeyPress("w" , () => { if (allowMovement) { if (onAnyPlatform) { player.velocity.y = -jumpAmount; }}})
    onKeyPress("e", () => {
        if (starsCollected == 3){
            starsCollected = 0;
            if (removing){return;}
            recreateOverlay()
            removing = true;
            waveY = 0;
            switchForm();
            starText.text = "Number of Stars Collected = 0/3"
        }
        else {
            const notEnough = add([
                text("Not enough stars collected !", {size: 8, font: "pixeled"}),
                color(mainColour),
                pos(player.pos.x, player.pos.y-100),
                "notEnough"
            ])
            setTimeout(() => {destroyAll("notEnough")}, 1000)
        }
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
                const finalPadPos = previewPad.pos.clone();
                destroy(previewPad);
                previewPad = null;
                placingPad = false;
                launchOrbArc(player.pos, finalPadPos);
            }
        }
    });

    //LOADING LEVELS
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
    loadLevel(level)
})

go("mainMenu")