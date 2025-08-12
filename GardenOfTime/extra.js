function switchForm() {
    form = form === "leaf" ? "flower" : "leaf";
    player.use(sprite(form));
    const newSize = spriteSizes[form];
    player.area.width = newSize.width * scaleFactor;
    player.area.height = newSize.height * scaleFactor;
    player.pos.y = height() - (128 + newSize.height * 4)
    playerWidth = newSize.width * scaleFactor;
    playerHeight = newSize.height * scaleFactor;

    // Zoom out camera to entire level
    let camX = levelWidth / 2
    let camY = height() / 4.5
    let zoom = width() / levelWidth 
    camPos(camX, camY)
    camScale(zoom)

    // Disable player movement
    playerGravity = 0;
    playerSpeed = 0;

    // Edit Player Position
    let previousPosX = player.pos.x;
    let previousPosY = player.pos.y;
    player.pos.x = levelWidth - 500;
    player.pos.y = height() - 1200;
    scaleFactor = 15;
    player.use(scale(scaleFactor));

    if (form == "flower"){
        resetPlayer(previousPosX, previousPosY)
    }

    // Arrow following player mouse

}