export function overlapping(a, b, tolerance = 10) {
    const aLeft = a.pos.x;
    const aRight = a.pos.x + (a.Padwidth || a.width);
    const aBottom = a.pos.y + (a.Padheight || a.height);

    const bLeft = b.pos.x;
    const bRight = b.pos.x + (b.myWidth || b.width);
    const bTop = b.pos.y;

    const horiPlatLap = aRight > bLeft && aLeft < bRight;
    const vertiPlatLap = Math.abs(aBottom - bTop) <= tolerance;
    return horiPlatLap && vertiPlatLap;
}

export function playerOnPad(player, pad, tolerance = 3) {
    const pLeft   = player.pos.x;
    const pRight  = pLeft + player.width;
    const pTop    = player.pos.y;
    const pBottom = pTop + player.height;

    const padLeft   = pad.pos.x;
    const padRight  = padLeft + (pad.Padwidth || pad.width);
    const padTop    = pad.pos.y;

    const horizontal = pRight > padLeft && pLeft < padRight;
    const comingDown = player.velocity.y >= 0;

    const alignedOnTop = Math.abs(pBottom - padTop) <= tolerance && pTop < padTop;
    return horizontal && alignedOnTop && comingDown;
}
