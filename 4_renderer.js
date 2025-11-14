/**
 * Vykreslí finální mapu na plátno (canvas).
 */
export function renderMap(finalMapData, tilesetImage, canvas, tileSize, tilesetWidthInTiles) {
    
    const mapHeight = finalMapData.length;
    const mapWidth = finalMapData[0].length;
    
    // Zkontroluj, jestli má mapa platné rozměry
    if (mapHeight === 0 || mapWidth === 0) {
        console.error("Data mapy jsou prázdná, nelze vykreslit.");
        return;
    }
    
    canvas.width = mapWidth * tileSize;
    canvas.height = mapHeight * tileSize;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    console.log(`Vykresluji finální mapu ${mapWidth}x${mapHeight}...`);

    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            
            const tileID = finalMapData[y][x];

            const sourceX = (tileID % tilesetWidthInTiles) * tileSize;
            const sourceY = Math.floor(tileID / tilesetWidthInTiles) * tileSize;
            const destX = x * tileSize;
            const destY = y * tileSize;

            ctx.drawImage(
                tilesetImage,
                sourceX, sourceY, tileSize, tileSize,
                destX, destY, tileSize, tileSize
            );
        }
    }
    console.log("Finální mapa vykreslena!");
}