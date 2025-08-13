import { spriteSizes, scaleFactor, playerSpeedDefault, playerGravityDefault, jumpAmount, levelWidth, arrowOffsetY, mainColour } from "./constants.js";
import { overlapping } from "./utils.js";
import { platforms } from "./environment.js";

export let player;
export let form = "leaf";
export let playerSpeed = playerSpeedDefault;
export let playerGravity = playerGravityDefault;
export let placingPad = false;
export let previewPad = null;
export let jumpPads = [];
let previousPosX, previousPosY;
let arrow;

export function createPlayer() {
    let spriteWidth = spriteSizes[form].width;
    let spriteHeight = spriteSizes[form].height;

    player = add([
        sprite("leaf"),
        pos(96, height() - (192 + spriteHeight * scaleFactor)),
        area({ width: spriteWidth * scaleFactor, height: spriteHeight * scaleFactor }),
        body(),
        scale(scaleFactor),
        anchor("topleft"),
        "player"
    ]);
    player.play("idle");
}

export function startPlacingJumpPad() {
    placingPad = true;
    previewPad = add([
        sprite("jumpPad"),
        pos(vec2(0, 0)),
        anchor("topleft"),
        z(6),
        "jumpPadPreview",
        { Padwidth: 100, Padheight: 15 }
    ]);
}

export function placeJumpPad(position) {
    const pad = add([
        sprite("jumpPad"),
        pos(position),
        anchor("topleft"),
        area(),
        body({ isStatic: true }),
        z(6),
        "jumpPad",
        { Padwidth: 100, Padheight: 15 }
    ]);
    jumpPads.push(pad);
}

export function switchForm() {
    if (form === "leaf") {
        // change to flower form
        form = "flower";
        player.use(sprite(form));
        let newSize = spriteSizes[form];
        player.area.width = newSize.width * scaleFactor;
        player.area.height = newSize.height * scaleFactor;
        player.pos.y = height() - (192 + newSize.height * scaleFactor);

        playerSpeed = 0;
        playerGravity = 0;

        previousPosX = player.pos.x;
        previousPosY = player.pos.y;

        player.pos.x = levelWidth - 500;
        player.pos.y = height() - 1200;
        player.use(scale(15));

        arrow = add([
            rect(25, 25),
            color(mainColour),
            anchor("left"),
            z(5),
            "arrow"
        ]);

        startPlacingJumpPad();
    } else {
        // revert to leaf form
        form = "leaf";
        player.use(sprite(form));
        let newSize = spriteSizes[form];
        player.area.width = newSize.width * scaleFactor;
        player.area.height = newSize.height * scaleFactor;
        player.pos.y = height() - (192 + newSize.height * scaleFactor);

        destroyAll("jumpPadPreview");
        destroyAll("arrow");

        playerGravity = playerGravityDefault;
        playerSpeed = playerSpeedDefault;

        player.pos.x = previousPosX;
        player.pos.y = previousPosY;
        player.use(scale(scaleFactor));

        placingPad = false;
    }
}
