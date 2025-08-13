import { tileSize, levelWidth, mainColour } from "./constants.js";

export const platforms = [];
export const allGrass = [];
export const allSpike = [];
export const allWeeds = [];

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

export function createGround() {
    for (let i = 0; i < 94; i++) {
        for (let y = 0; y < 5; y++) {
            add([
                sprite("ground"),
                pos(32 * i, height() - tileSize * (y + 1)),
            ]);
        }
    }
}

export function createTopGround() {
    for (let i = 0; i < 94; i++) {
        const topTile = add([
            sprite("topGround"),
            pos(32 * i, height() - 192),
            area({ collisionIgnore: ["player"] }),
            z(1)
        ]);
        platforms.push(topTile);
    }

    platforms.push(
        add([
            pos(0, height() - 192),
            rect(levelWidth, 10),
            area(),
            "platform",
            { myWidth: levelWidth, myHeight: 10 }
        ])
    );
}

export function createGrass(position) {
    const grassBlock = add([
        sprite("grass"),
        pos(position),
        scale(4),
        area(),
        z(10),
        "grass"
    ]);
    allGrass.push(grassBlock);
}

export function createSpike(position) {
    const spikeBlock = add([
        sprite("spike"),
        pos(position),
        area(),
        scale(3),
        "spike"
    ]);
    allSpike.push(spikeBlock);
}

export function createWeed(position) {
    const weedBlock = add([
        sprite("weed"),
        pos(position),
        area(),
        scale(3),
        "weed"
    ]);
    allWeeds.push(weedBlock);
}
