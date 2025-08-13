import "./config.js";
import { createGround, createTopGround, createGrass, createSpike, createWeed, platforms } from "./environment.js";
import { createPlayer, player, form, placingPad, previewPad, jumpPads } from "./player.js";
import { setupUI, starText, stealthBarInner, healthBarInner } from "./ui.js";
import { overlapping, playerOnPad } from "./utils.js";
import { setupControls } from "./controls.js";
import { mainColour, fixedDt, jumpAmount, levelWidth } from "./constants.js";

let starsCollected = 0;
let shownMessage = false;
let allowMovementFlag = true;
let onAnyPlatformFlag = false;
let removingFlag = false;
let cells = [];
let offsets = [];
let waveY = 0;
let actualStealth = 0;
let displayedStealth = 0;
let actualHealth = 1;
let displayedHealth = 1;

function allowMovement() { return allowMovementFlag; }
function onAnyPlatform() { return onAnyPlatformFlag; }
function removing(value) { if (value !== undefined) removingFlag = value; return removingFlag; }
let waveYRef = { value: waveY };

function recreateOverlay() {
    for (let c of cells) { if (c && c.exists) { destroy(c); } }
    cells = [];
    offsets = [];
    const cols = Math.ceil(width() / 16);
    const rows = Math.ceil(height() / 16);
    for (let col = 0; col < cols; col++) {
        offsets[col] = Math.round(rand(-2, 2)) * 16;
        const x = col * 16;
        for (let row = 0; row < rows; row++) {
            const y = row * 16;
            const cell = add([
                pos(x, y),
                rect(16, 16),
                color(mainColour),
                fixed(),
                z(999),
                "transitionCell",
                { columnIndex: col, rowY: y }
            ]);
            cells.push(cell);
        }
    }
}

// Load environment and player
createGround();
createTopGround();
createGrass(vec2(50, height() - 192 - 64));
createSpike(vec2(150, height() - 192 - 96));
createWeed(vec2(300, height() - 192 - 51));
createPlayer();
setupUI();
setupControls(allowMovement, onAnyPlatform, jumpAmount, removing, recreateOverlay, waveYRef);

// Collisions
player.onCollide("star", (star) => {
    starsCollected++;
    starText.text = `Number of Stars Collected = ${starsCollected}/3`;
    destroy(star);
});

player.onCollide("grass", () => { actualStealth = 1; });
player.onCollide("weed", () => { actualStealth = 0.4; });
player.onCollideEnd("grass", () => { actualStealth = 0; });
player.onCollideEnd("weed", () => { actualStealth = 0; });
player.onCollide("spike", () => { actualHealth -= 1/3; });

// Update loop
onUpdate(() => {
    if (form === "leaf") {
        let camX = Math.min(Math.max(player.pos.x, width()/4), levelWidth - width()/4);
        camPos(camX, height()/1.7);
        camScale(2);
    }

    for (const pad of jumpPads) {
        if (playerOnPad(player, pad)) {
            player.pos.y = pad.pos.y - player.height;
            player.velocity.y = -jumpAmount * 1.5;
        }
    }

    if (starsCollected === 3 && !shownMessage) {
        const endMessage = add([
            text("Reach the end to go to the next level!", { size: 15, font: "pixeled" }),
            color(mainColour),
            fixed()
        ]);
        endMessage.pos.x = (width() - endMessage.width) / 2;
        endMessage.pos.y = 200;
        shownMessage = true;
    }

    player.pos.x = Math.min(Math.max(player.pos.x, 10), levelWidth - 40);
    onAnyPlatformFlag = false;
    player.velocity.y += playerGravity * fixedDt;
    player.pos.x += player.velocity.x * fixedDt;
    player.pos.y += player.velocity.y * fixedDt;

    for (const platform of platforms) {
        const pPos = platform.pos;
        const pLeft = pPos.x;
        const pRight = pLeft + platform.myWidth;
        const pTop = pPos.y;
        const pBottom = pTop + platform.myHeight;

        const playerLeft = player.pos.x;
        const playerRight = player.pos.x + player.width;
        const playerBottom = player.pos.y + player.height;
        const playerTop = player.pos.y;

        const horiLap = playerRight > (pLeft - 2) && playerLeft < (pRight + 2);
        const vertiLap = playerBottom > pTop && playerTop < pBottom;

        if (horiLap && playerBottom > pTop && playerBottom < pTop + 10 && player.velocity.y >= 0) {
            player.pos.y = pTop - player.height;
            player.velocity.y = 0;
            onAnyPlatformFlag = true;
        }
    }

    if (removingFlag) {
        allowMovementFlag = false;
        for (let i = cells.length - 1; i >= 0; i--) {
            const cell = cells[i];
            const offset = offsets[cell.columnIndex] || 0;
            if (cell.rowY <= waveYRef.value - offset) {
                destroy(cell);
                cells.splice(i, 1);
            }
        }
        waveYRef.value += 2000 * fixedDt;
        if (cells.length === 0) {
            removingFlag = false;
            allowMovementFlag = true;
        }
    }

    const barSpeed = 3;
    displayedStealth += (actualStealth - displayedStealth) * barSpeed * fixedDt;
    displayedHealth += (actualHealth - displayedHealth) * barSpeed * fixedDt;
    stealthBarInner.width = 400 * displayedStealth;
    healthBarInner.width = 400 * displayedHealth;
});
