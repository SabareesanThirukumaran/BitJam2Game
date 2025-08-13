import { mainColour } from "./constants.js";

export let starText;
export let stealthBarInner;
export let healthBarInner;

export function setupUI() {
    // Stars collected display
    starText = add([
        text("Number of Stars Collected = 0/3", { size: 25, font: "pixeled" }),
        pos(width() - 800, 50),
        color(mainColour),
        fixed()
    ]);

    // Stealth bar
    add([text("Stealth :", { size: 25, font: "pixeled" }), pos(50, 70), color(mainColour), fixed()]);
    add([rect(420, 60), pos(300, 50), color(mainColour), fixed(), z(100)]);
    add([rect(400, 50), pos(310, 55), color(0, 0, 0), fixed(), z(101)]);
    stealthBarInner = add([rect(400, 50), pos(310, 55), color(mainColour), outline(4), fixed(), z(101)]);

    // Health bar
    add([text("Health :", { size: 25, font: "pixeled" }), pos(50, 140), color(mainColour), fixed()]);
    add([rect(420, 60), pos(300, 120), color(mainColour), fixed(), z(100)]);
    add([rect(400, 50), pos(310, 125), color(0, 0, 0), fixed(), z(101)]);
    healthBarInner = add([rect(400, 50), pos(310, 125), color(mainColour), outline(4), fixed(), z(101)]);
}
