import { player, playerSpeed, playerGravity, placingPad, previewPad, placeJumpPad, switchForm } from "./player.js";
import { overlapping } from "./utils.js";
import { platforms } from "./environment.js";

export function setupControls(allowMovement, onAnyPlatform, jumpAmount, removing, recreateOverlay, waveYRef) {
    onKeyDown("a", () => { if (allowMovement()) player.velocity.x = -playerSpeed; });
    onKeyDown("d", () => { if (allowMovement()) player.velocity.x = playerSpeed; });
    onKeyRelease("a", () => { if (allowMovement() && player.velocity.x < 0) player.velocity.x = 0; });
    onKeyRelease("d", () => { if (allowMovement() && player.velocity.x > 0) player.velocity.x = 0; });
    onKeyPress("w", () => { if (allowMovement() && onAnyPlatform()) player.velocity.y = -jumpAmount; });

    onKeyPress("e", () => {
        if (removing()) return;
        recreateOverlay();
        removing(true);
        waveYRef.value = 0;
        switchForm();
    });

    onKeyPress("space", () => {
        if (placingPad && previewPad) {
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
                removing(false);
                switchForm();
            }
        }
    });
}
