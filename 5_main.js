// Import Simplex Noise
import { createNoise2D } from 'https://cdn.jsdelivr.net/npm/simplex-noise@4.0.1/dist/esm/simplex-noise.js';

// Import našich modulů
import * as C from './1_config.js';
import * as Logika from './2_logika_masek.js';
import * as Slovnik from './3_slovniky.js';
import { renderMap } from './4_renderer.js';

// =================================================================
// 1. GLOBÁLNÍ PROMĚNNÉ A KONSTANTY GENERÁTORU
// =================================================================

let currentMapData = [];    // Surová data (ID 0, 1, 2...)
let currentTileKey = {};    // Klíč pro barvy (pro surový náhled)
let currentMapWidth = 0;
let currentMapHeight = 0;
let cityIdCounter = 1;
let mapHistoryStack = [];   
let roadStartPoint = null;
let roadEndPoint = null;

// --- Proměnné Konvertoru ---
let finalMapData = null;        // Finální data (ID 22, 19, 55...)
let loadedTilesetImage = null;  // Načtený .png tileset

// --- Základní nastavení ---
const TILE_SIZE = 4; // Velikost dlaždice pro surový náhled

// =================================================================
// 2. ZÍSKÁNÍ PRVKŮ Z HTML
// =================================================================

// Plátna
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
const finalRenderCanvas = document.getElementById('finalRenderCanvas');

// Tlačítka Generátoru
const generateTerrainButton = document.getElementById('generateTerrainButton');
const addCityButton = document.getElementById('addCityButton');
const undoCityButton = document.getElementById('undoCityButton');
const createRoadButton = document.getElementById('createRoadButton');

// Tlačítka Nastavení
const saveSettingsButton = document.getElementById('saveSettingsButton');
const loadSettingsButton = document.getElementById('loadSettingsButton');

// Tlačítka Exportu
const exportSurovyJsonButton = document.getElementById('exportButton');
const exportSurovyPngButton = document.getElementById('viewImageButton');
const exportFinalJsonButton = document.getElementById('exportFinalJsonButton');
const exportFinalPngButton = document.getElementById('exportImageButton');

// Tlačítka Konvertoru
const tilesetFileInput = document.getElementById('tilesetFileInput');
const tileSizeInput = document.getElementById('tileSize');
const tilesetWidthInput = document.getElementById('tilesetWidth');
const runConversionButton = document.getElementById('runConversionButton');

// Vstupy Generátoru (všechny ostatní)
const zoomInput = document.getElementById('zoom');
const seedInput = document.getElementById('seed');
const widthInput = document.getElementById('mapWidth');
const heightInput = document.getElementById('mapHeight');
const waterLevelSlider = document.getElementById('waterLevel');
const mountainLevelSlider = document.getElementById('mountainLevel');
const waterValueSpan = document.getElementById('waterValue');
const mountainValueSpan = document.getElementById('mountainValue');
const colorVodaInput = document.getElementById('colorVoda');
const colorTravaInput = document.getElementById('colorTrava');
const colorHoryInput = document.getElementById('colorHory');
const resourceContainer = document.getElementById('resourceContainer');
const addResourceButton = document.getElementById('addResourceButton');
const forestFrequencySlider = document.getElementById('forestFrequency');
const forestFrequencyValueSpan = document.getElementById('forestFrequencyValue');
const forestSizeSlider = document.getElementById('forestSize');
const forestSizeValueSpan = document.getElementById('forestSizeValue');
const colorLesInput = document.getElementById('colorLes');
const maxBlocksInput = document.getElementById('maxBlocks');
const minSizeInput = document.getElementById('minSize');
const maxSizeInput = document.getElementById('maxSize');
const roadWidthInput = document.getElementById('roadWidth');
const blockGapInput = document.getElementById('blockGap');
const cityStartXSlider = document.getElementById('cityStartXSlider');
const cityStartYSlider = document.getElementById('cityStartYSlider');
const cityStartXInput = document.getElementById('cityStartXInput');
const cityStartYInput = document.getElementById('cityStartYInput');
const cityListContainer = document.getElementById('cityListContainer');
const turnPenaltySlider = document.getElementById('turnPenaltySlider');
const turnPenaltyValue = document.getElementById('turnPenaltyValue');
const setRoadStartButton = document.getElementById('setRoadStartButton');
const roadStartDisplay = document.getElementById('roadStartDisplay');
const setRoadEndButton = document.getElementById('setRoadEndButton');
const roadEndDisplay = document.getElementById('roadEndDisplay');

// =================================================================
// 3. LOGIKA GENERÁTORU (TVOJE FUNKCE)
// =================================================================

function createSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return () => (hash + Math.random()) / 2147483647; 
}

function createResourceRow(color = '#FF0000', min = 0.8, max = 1.0) {
    const row = document.createElement('div');
    row.className = 'resource-row';
    row.innerHTML = `
        <input type="color" value="${color}">
        <div><label>Od (0-1):</label><input type="number" class="res-min" value="${min}" min="0" max="1" step="0.01"></div>
        <div><label>Do (0-1):</label><input type="number" class="res-max" value="${max}" min="0" max="1" step="0.01"></div>
        <button class="remove-btn">X</button>
    `;
    row.querySelector('.remove-btn').addEventListener('click', () => { row.remove(); });
    resourceContainer.appendChild(row);
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getTile(grid, x, y) {
    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
        return -1; 
    }
    return grid[y][x];
}

// --- Uložení/Načtení Nastavení ---
function saveSettings() {
    const resources = [];
    document.querySelectorAll('#resourceContainer .resource-row').forEach(row => {
        resources.push({
            color: row.querySelector('input[type="color"]').value,
            min: row.querySelector('.res-min').value,
            max: row.querySelector('.res-max').value
        });
    });
    const settings = {
        mapWidth: widthInput.value, mapHeight: heightInput.value, zoom: zoomInput.value, seed: seedInput.value,
        waterLevel: waterLevelSlider.value, mountainLevel: mountainLevelSlider.value,
        colorVoda: colorVodaInput.value, colorTrava: colorTravaInput.value, colorHory: colorHoryInput.value,
        forestFrequency: forestFrequencySlider.value, forestSize: forestSizeSlider.value, colorLes: colorLesInput.value,
        maxBlocks: maxBlocksInput.value, minSize: minSizeInput.value, maxSize: maxSizeInput.value,
        roadWidth: roadWidthInput.value, blockGap: blockGapInput.value,
        cityStartX: cityStartXInput.value, cityStartY: cityStartYInput.value,
        turnPenalty: turnPenaltySlider.value, resources: resources
    };
    localStorage.setItem('worldGeneratorSettings', JSON.stringify(settings));
    alert("Nastavení bylo uloženo do prohlížeče.");
}

function loadSettings() {
    const saved = localStorage.getItem('worldGeneratorSettings');
    if (!saved) { console.log("Žádné uložené nastavení nenalezeno."); return false; }
    const settings = JSON.parse(saved);

    widthInput.value = settings.mapWidth;
    heightInput.value = settings.mapHeight;
    zoomInput.value = settings.zoom;
    seedInput.value = settings.seed;
    waterLevelSlider.value = settings.waterLevel;
    mountainLevelSlider.value = settings.mountainLevel;
    colorVodaInput.value = settings.colorVoda;
    colorTravaInput.value = settings.colorTrava;
    colorHoryInput.value = settings.colorHory;
    forestFrequencySlider.value = settings.forestFrequency;
    forestSizeSlider.value = settings.forestSize;
    colorLesInput.value = settings.colorLes;
    maxBlocksInput.value = settings.maxBlocks;
    minSizeInput.value = settings.minSize;
    maxSizeInput.value = settings.maxSize;
    roadWidthInput.value = settings.roadWidth;
    blockGapInput.value = settings.blockGap;
    cityStartXInput.value = settings.cityStartX;
    cityStartXSlider.value = settings.cityStartX;
    cityStartYInput.value = settings.cityStartY;
    cityStartYSlider.value = settings.cityStartY;
    turnPenaltySlider.value = settings.turnPenalty;

    waterValueSpan.textContent = parseFloat(waterLevelSlider.value).toFixed(2);
    mountainValueSpan.textContent = parseFloat(mountainLevelSlider.value).toFixed(2);
    forestFrequencyValueSpan.textContent = parseFloat(forestFrequencySlider.value).toFixed(2);
    forestSizeValueSpan.textContent = parseFloat(forestSizeSlider.value).toFixed(2);
    turnPenaltyValue.textContent = parseFloat(turnPenaltySlider.value).toFixed(1);

    resourceContainer.innerHTML = ''; 
    if (settings.resources && settings.resources.length > 0) {
        settings.resources.forEach(res => createResourceRow(res.color, res.min, res.max));
    }
    return true;
}

// --- Logika Města ---
class CityPlanner {
     constructor(x, y, direction) { this.x = x; this.y = y; this.direction = direction; }
     planBlock(grid, agentList, minSize, maxSize, ROAD_WIDTH, BLOCK_GAP) {
         const innerWidth = randomInt(minSize, maxSize);
         const innerHeight = randomInt(minSize, maxSize);
         const totalWidth = innerWidth + (ROAD_WIDTH * 2);
         const totalHeight = innerHeight + (ROAD_WIDTH * 2);
         let startX, startY;
         switch (this.direction) {
             case 0: startX = this.x - Math.floor(totalWidth / 2); startY = this.y - totalHeight - BLOCK_GAP + 1; break;
             case 1: startX = this.x + BLOCK_GAP; startY = this.y - Math.floor(totalHeight / 2); break;
             case 2: startX = this.x - Math.floor(totalWidth / 2); startY = this.y + BLOCK_GAP; break;
             case 3: startX = this.x - totalWidth - BLOCK_GAP + 1; startY = this.y - Math.floor(totalHeight / 2); break;
         }
         if (isAreaClearForCity(grid, startX, startY, totalWidth, totalHeight)) {
             drawBlockOnMap(grid, startX, startY, totalWidth, totalHeight, ROAD_WIDTH);
             if (this.direction !== 2) agentList.push(new CityPlanner(startX + Math.floor(totalWidth / 2), startY, 0)); 
             if (this.direction !== 3) agentList.push(new CityPlanner(startX + totalWidth - 1, startY + Math.floor(totalHeight / 2), 1)); 
             if (this.direction !== 0) agentList.push(new CityPlanner(startX + Math.floor(totalWidth / 2), startY + totalHeight - 1, 2)); 
             if (this.direction !== 1) agentList.push(new CityPlanner(startX, startY + Math.floor(totalHeight / 2), 3)); 
             return true;
         }
         return false;
     }
}
function isAreaClearForCity(grid, x, y, w, h) {
    const gridHeight = grid.length;
    const gridWidth = grid[0].length;
    for (let iy = y; iy < y + h; iy++) {
        for (let ix = x; ix < x + w; ix++) {
            if (iy < 0 || iy >= gridHeight || ix < 0 || ix >= gridWidth) return false;
            if (getTile(grid, ix, iy) !== C.ZEME_SUROVE && getTile(grid, ix, iy) !== C.LES_SUROVE) return false;
        }
    }
    return true;
}
function drawBlockOnMap(grid, x, y, totalW, totalH, roadWidth) {
     const innerRoadWidth = Math.max(0, roadWidth); 
     for (let iy = y; iy < y + totalH; iy++) {
         for (let ix = x; ix < x + totalW; ix++) {
             if (!grid[iy] || grid[iy][ix] === undefined) continue;
             if (iy < (y + innerRoadWidth) || iy >= (y + totalH - innerRoadWidth) || 
                 ix < (x + innerRoadWidth) || ix >= (x + totalW - innerRoadWidth)) {
                 grid[iy][ix] = C.MESTSKA_CESTA_SUROVE;
             } else {
                 grid[iy][ix] = C.PARK_SUROVE; 
             }
         }
     }
}

// --- Logika Pathfindingu ---
function getPathCost(tileId) {
     if (tileId === C.ZEME_SUROVE || tileId === C.LES_SUROVE || 
         tileId === C.CESTA_SUROVE || tileId === C.MESTSKA_CESTA_SUROVE || 
         tileId === C.PARK_SUROVE) { 
         return 1; 
     }
     return Infinity; 
}
function heuristic_manhattan(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
function heuristic_euclidean(a, b) { const dx = Math.abs(a.x - b.x); const dy = Math.abs(a.y - b.y); return Math.sqrt(dx * dx + dy * dy); }
function findPath_Dynamic(grid, start, end, heuristic, turnPenalty) {
    const openSet = []; 
    const closedSet = new Set();
    const startNode = { x: start.x, y: start.y, g: 0, h: heuristic(start, end), f: heuristic(start, end), parent: null, dir: null };
    openSet.push(startNode);
    const directions = [ { x: 0, y: 1, name: 'S' }, { x: 0, y: -1, name: 'N' }, { x: 1, y: 0, name: 'E' }, { x: -1, y: 0, name: 'W' } ];

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f);
        const currentNode = openSet.shift();
        const currentKey = `${currentNode.x},${currentNode.y}`;
        closedSet.add(currentKey);

        if (currentNode.x === end.x && currentNode.y === end.y) {
            const path = [];
            let tempNode = currentNode;
            while (tempNode) { path.push([tempNode.x, tempNode.y]); tempNode = tempNode.parent; }
            return path.reverse(); 
        }

        for (const dir of directions) {
            const newX = currentNode.x + dir.x;
            const newY = currentNode.y + dir.y;
            const neighborKey = `${newX},${newY}`;
            
            if (newX < 0 || newX >= currentMapWidth || newY < 0 || newY >= currentMapHeight) continue;
            if (closedSet.has(neighborKey)) continue;
            
            const cost = getPathCost(getTile(grid, newX, newY));
            if (cost === Infinity) continue; 
            
            let turnCost = 0;
            if (turnPenalty > 0 && currentNode.parent && currentNode.dir && currentNode.dir !== dir.name) {
                turnCost = turnPenalty;
            }
            
            const tentativeGScore = currentNode.g + cost + turnCost;
            let neighborNode = openSet.find(n => n.x === newX && n.y === newY);
            
            if (!neighborNode) {
                neighborNode = {
                    x: newX, y: newY, g: tentativeGScore, h: heuristic({x: newX, y: newY}, end),
                    f: tentativeGScore + heuristic({x: newX, y: newY}, end),
                    parent: currentNode, dir: dir.name
                };
                openSet.push(neighborNode);
            } else if (tentativeGScore < neighborNode.g) {
                neighborNode.g = tentativeGScore;
                neighborNode.f = tentativeGScore + neighborNode.h;
                neighborNode.parent = currentNode;
                neighborNode.dir = dir.name;
            }
        }
    }
    return null; // Cesta nenalezena
}

// --- Hlavní Funkce Generátoru ---
function drawCombinedMap(grid, tileKey, width, height) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const tileID = grid[y][x];
            const color = tileKey[tileID] || '#FF00FF'; 
            ctx.fillStyle = color;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
    const markerX = parseInt(cityStartXInput.value);
    const markerY = parseInt(cityStartYInput.value);
    const drawX = (markerX * TILE_SIZE);
    const drawY = (markerY * TILE_SIZE);
    const markerPixelSize = (TILE_SIZE * 3);
    const finalX = drawX - TILE_SIZE;
    const finalY = drawY - TILE_SIZE;
    ctx.strokeStyle = '#FF0000'; 
    ctx.lineWidth = 2; 
    ctx.strokeRect(finalX, finalY, markerPixelSize, markerPixelSize);
}

function redrawMapWithMarker() {
    if (currentMapData.length === 0) return; 
    drawCombinedMap(currentMapData, currentTileKey, currentMapWidth, currentMapHeight);
}

function updateCityListUI(cities) {
    cityListContainer.innerHTML = ''; 
    if (cities.length === 0) {
        cityListContainer.innerHTML = '<span style="font-size: 12px; text-align: center;">Manuální propojování aktivní</span>';
        return;
    }
}

function generateTerrain() {
    console.log("Krok 1: Generuji terén mapy...");
    const MAP_WIDTH = parseInt(widthInput.value);
    const MAP_HEIGHT = parseInt(heightInput.value);
    
    cityStartXSlider.max = MAP_WIDTH - 1;
    cityStartXInput.max = MAP_WIDTH - 1;
    cityStartYSlider.max = MAP_HEIGHT - 1;
    cityStartYInput.max = MAP_HEIGHT - 1;
    if (parseInt(cityStartXInput.value) >= MAP_WIDTH) {
        cityStartXInput.value = MAP_WIDTH - 1;
        cityStartXSlider.value = MAP_WIDTH - 1;
    }
    if (parseInt(cityStartYInput.value) >= MAP_HEIGHT) {
        cityStartYInput.value = MAP_HEIGHT - 1;
        cityStartYSlider.value = MAP_HEIGHT - 1;
    }
    
    canvas.width = MAP_WIDTH * TILE_SIZE;
    canvas.height = MAP_HEIGHT * TILE_SIZE;

    const zoom = parseFloat(zoomInput.value);
    const seed = seedInput.value;

    const BARVY = {
        VODA: colorVodaInput.value,
        TRAVA: colorTravaInput.value,
        HORY: colorHoryInput.value,
        LES: colorLesInput.value 
    };

    const waterThreshold = Math.min(parseFloat(waterLevelSlider.value), parseFloat(mountainLevelSlider.value));
    const mountainThreshold = Math.max(parseFloat(waterLevelSlider.value), parseFloat(mountainLevelSlider.value));

    const forestFrequency = parseFloat(forestFrequencySlider.value);
    const forestSize = parseFloat(forestSizeSlider.value);

    let terrainData = []; 
    let tileKey = {
        [C.VODA_SUROVE]: BARVY.VODA,
        [C.ZEME_SUROVE]: BARVY.TRAVA,
        [C.HORY_SUROVE]: BARVY.HORY,
        [C.LES_SUROVE]: BARVY.LES,
        [C.CESTA_SUROVE]: C.COLOR_ROAD,
        [C.MESTSKA_CESTA_SUROVE]: C.COLOR_ROAD, 
        [C.PARK_SUROVE]: C.COLOR_PARK
    };
    
    const zdroje = [];
    let resourceIdCounter = 4; 

    document.querySelectorAll('#resourceContainer .resource-row').forEach(row => {
        const color = row.querySelector('input[type="color"]').value;
        const min = parseFloat(row.querySelector('.res-min').value);
        const max = parseFloat(row.querySelector('.res-max').value);
        const resourceId = resourceIdCounter++;
        zdroje.push({ barva: color, prahMin: Math.min(min, max), prahMax: Math.max(min, max), id: resourceId });
        tileKey[resourceId] = color;
    });
    
    const seededRandom = createSeed(seed);
    const noiseGeneratorVyska = createNoise2D(seededRandom);
    const noiseGeneratorSuroviny = createNoise2D(seededRandom);
    const noiseGeneratorLesy = createNoise2D(seededRandom); 

    // KROK 1
    for (let y = 0; y < MAP_HEIGHT; y++) {
        let mapRow = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            const noiseX = x / zoom;
            const noiseY = y / zoom;
            let hodnotaVysky = (noiseGeneratorVyska(noiseX, noiseY) + 1) / 2;
            let tileID;
            if (hodnotaVysky < waterThreshold) {
                tileID = C.VODA_SUROVE;
            } else if (hodnotaVysky < mountainThreshold) {
                tileID = C.ZEME_SUROVE;
            } else {
                tileID = C.HORY_SUROVE;
                const hodnotaSurovin = (noiseGeneratorSuroviny(noiseX * 1.8, noiseY * 1.8) + 1) / 2;
                for (const zdroj of zdroje) {
                    if (hodnotaSurovin >= zdroj.prahMin && hodnotaSurovin <= zdroj.prahMax) {
                        tileID = zdroj.id;
                        break;
                    }
                }
            }
            mapRow.push(tileID);
        }
        terrainData.push(mapRow);
    }

    // KROK 2
    let finalMapWithForests = terrainData.map(row => [...row]); 
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const suroveID = getTile(terrainData, x, y); 
            if (suroveID !== C.ZEME_SUROVE) continue;

            let hasBlockingNeighbor = false;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const neighborID = getTile(terrainData, x + dx, y + dy); 
                    if (neighborID === C.VODA_SUROVE || neighborID === C.HORY_SUROVE) {
                        hasBlockingNeighbor = true;
                        break;
                    }
                }
                if (hasBlockingNeighbor) break;
            }

            if (!hasBlockingNeighbor) {
                const noiseXLes = x / (zoom * forestSize);
                const noiseYLes = y / (zoom * forestSize);
                const hodnotaLesu = (noiseGeneratorLesy(noiseXLes, noiseYLes) + 1) / 2;
                if (hodnotaLesu > (1 - forestFrequency)) {
                    finalMapWithForests[y][x] = C.LES_SUROVE; 
                }
            }
        }
    }
    
    // KROK 3
    cityIdCounter = 1; 
    mapHistoryStack = [];
    const newCitiesList = [];
    mapHistoryStack.push({
        map: finalMapWithForests.map(row => [...row]), 
        cities: newCitiesList
    }); 
    currentMapData = mapHistoryStack[0].map;
    
    currentTileKey = tileKey;
    currentMapWidth = MAP_WIDTH;
    currentMapHeight = MAP_HEIGHT;

    drawCombinedMap(currentMapData, currentTileKey, currentMapWidth, currentMapHeight);
    updateCityListUI(newCitiesList);
    
    console.log("Terén vykreslen.");
}

function addCity() {
    if (mapHistoryStack.length === 0) { alert("Nejprve musíte vygenerovat terén! (Tlačítko 1)"); return; }
    const lastState = mapHistoryStack[mapHistoryStack.length - 1];
    const newMapState = lastState.map.map(row => [...row]);
    const newCitiesList = [...lastState.cities]; 

    const MAX_BLOCKS = parseInt(maxBlocksInput.value);
    const ROAD_WIDTH = parseInt(roadWidthInput.value);
    const BLOCK_GAP = parseInt(blockGapInput.value);
    const MIN_SIZE = parseInt(minSizeInput.value);
    const MAX_SIZE = parseInt(maxSizeInput.value);
    const cityStartX = parseInt(cityStartXInput.value); 
    const cityStartY = parseInt(cityStartYInput.value); 
    let agents = [];
    const startInnerW = randomInt(MIN_SIZE, MAX_SIZE);
    const startInnerH = randomInt(MIN_SIZE, MAX_SIZE);
    const startTotalW = startInnerW + (ROAD_WIDTH * 2);
    const startTotalH = startInnerH + (ROAD_WIDTH * 2);
    const startX = cityStartX - Math.floor(startTotalW / 2);
    const startY = cityStartY - Math.floor(startTotalH / 2);
    let blocksBuilt = 0;
    
    if (isAreaClearForCity(newMapState, startX, startY, startTotalW, startTotalH)) {
        drawBlockOnMap(newMapState, startX, startY, startTotalW, startTotalH, ROAD_WIDTH);
        blocksBuilt++;
        agents.push(new CityPlanner(startX + Math.floor(startTotalW / 2), startY, 0)); 
        agents.push(new CityPlanner(startX + startTotalW - 1, startY + Math.floor(startTotalH / 2), 1)); 
        agents.push(new CityPlanner(startX + Math.floor(startTotalW / 2), startY + startTotalH - 1, 2));
        agents.push(new CityPlanner(startX, startY + Math.floor(startTotalH / 2), 3));
    } else {
        alert("Startovní bod města (Start X/Y) není na trávě ani v lese! Vyberte jiné souřadnice.");
        redrawMapWithMarker(); 
        return; 
    }
    while (blocksBuilt < MAX_BLOCKS && agents.length > 0) {
        const agentIndex = randomInt(0, agents.length - 1);
        const agent = agents[agentIndex];
        if (agent.planBlock(newMapState, agents, MIN_SIZE, MAX_SIZE, ROAD_WIDTH, BLOCK_GAP)) {
            blocksBuilt++;
        }
        agents.splice(agentIndex, 1);
    }
    const newCity = { id: cityIdCounter++, name: `Město ${cityIdCounter - 1}`, x: cityStartX, y: cityStartY };
    newCitiesList.push(newCity);
    mapHistoryStack.push({ map: newMapState, cities: newCitiesList });
    currentMapData = newMapState;
    drawCombinedMap(currentMapData, currentTileKey, currentMapWidth, currentMapHeight);
    updateCityListUI(newCitiesList);
}

function createRoad() {
    if (mapHistoryStack.length === 0) { alert("Nejprve vygenerujte terén."); return; }
    if (!roadStartPoint || !roadEndPoint) { alert("Musíte nejprve nastavit Start i Konec cesty pomocí kurzoru!"); return; }
    
    const city1 = roadStartPoint;
    const city2 = roadEndPoint;
    
    const lastState = mapHistoryStack[mapHistoryStack.length - 1];
    const newMapState = lastState.map.map(row => [...row]);
    
    const idealPath = findPath_Dynamic(newMapState, city1, city2, heuristic_euclidean, 0);
    if (idealPath === null) { alert("Cestu mezi body se nepodařilo najít."); return; }
    
    const waypoints = [city1];
    const L = idealPath.length;
    waypoints.push({ x: idealPath[Math.floor(L * 0.2)][0], y: idealPath[Math.floor(L * 0.2)][1] });
    waypoints.push({ x: idealPath[Math.floor(L * 0.4)][0], y: idealPath[Math.floor(L * 0.4)][1] });
    waypoints.push({ x: idealPath[Math.floor(L * 0.6)][0], y: idealPath[Math.floor(L * 0.6)][1] });
    waypoints.push({ x: idealPath[Math.floor(L * 0.8)][0], y: idealPath[Math.floor(L * 0.8)][1] });
    waypoints.push(city2); 
    
    const finalPath = [];
    const turnPenalty = parseFloat(turnPenaltySlider.value);
    
    for (let i = 0; i < waypoints.length - 1; i++) {
        const segment = findPath_Dynamic(newMapState, waypoints[i], waypoints[i+1], heuristic_manhattan, turnPenalty);
        if (segment === null) {
            alert(`Chyba: Cesta byla blokována při propojování segmentu ${i + 1}.`);
            return; 
        }
        finalPath.push(...(i === 0 ? segment : segment.slice(1)));
    }

    let startIndex = 0;
    for (let i = 0; i < finalPath.length; i++) {
        const [x, y] = finalPath[i];
        if (x < 0 || x >= currentMapWidth || y < 0 || y >= currentMapHeight) continue;
        const tile = newMapState[y][x];
        if (tile !== C.MESTSKA_CESTA_SUROVE && tile !== C.PARK_SUROVE) {
            startIndex = i;
            break;
        }
    }

    let endIndex = finalPath.length - 1;
    for (let i = finalPath.length - 1; i >= 0; i--) {
        const [x, y] = finalPath[i];
        if (x < 0 || x >= currentMapWidth || y < 0 || y >= currentMapHeight) continue;
        const tile = newMapState[y][x];
        if (tile !== C.MESTSKA_CESTA_SUROVE && tile !== C.PARK_SUROVE) {
            endIndex = i;
            break;
        }
    }

    const clippedPath = finalPath.slice(startIndex, endIndex + 1);
    
    clippedPath.forEach(pos => {
        const [x, y] = pos;
        const brushPoints = [ [x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1] ];
        for (const [px, py] of brushPoints) {
            if (px >= 0 && px < currentMapWidth && py >= 0 && py < currentMapHeight) {
                newMapState[py][px] = C.CESTA_SUROVE;
            }
        }
    });
    
    mapHistoryStack.push({ map: newMapState, cities: lastState.cities });
    currentMapData = newMapState;
    
    redrawMapWithMarker();
    
    roadStartPoint = null;
    roadEndPoint = null;
    roadStartDisplay.value = "Start: Není nastaven";
    roadEndDisplay.value = "Konec: Není nastaven";
}

function undoCity() {
    if (mapHistoryStack.length <= 1) { return; }
    mapHistoryStack.pop();
    const currentState = mapHistoryStack[mapHistoryStack.length - 1];
    currentMapData = currentState.map;
    redrawMapWithMarker();
    updateCityListUI(currentState.cities);
}

function exportSurovyJSON() {
    if (currentMapData.length === 0) { alert("Nejprve musíte vygenerovat terén!"); return; }
    const exportObj = {
        width: currentMapWidth,
        height: currentMapHeight,
        tileSize: TILE_SIZE,
        tileKey: currentTileKey,
        data: currentMapData,
        cities: mapHistoryStack.length > 0 ? mapHistoryStack[mapHistoryStack.length - 1].cities : [] 
    };
    const jsonString = JSON.stringify(exportObj);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "svet_mapa_SUROVA.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportSurovyPNG() {
    if (currentMapData.length === 0) { alert("Nejprve musíte vygenerovat terén!"); return; }
    const dataUrl = canvas.toDataURL('image/png');
    const newWindow = window.open();
    newWindow.document.write(`
        <html style="background: #2c2c2c; margin: 0; padding: 0;">
        <head><title>Náhled surové mapy</title></head>
        <body style="margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh;">
            <img src="${dataUrl}" alt="Vygenerovaná mapa" style="image-rendering: pixelated; width: 90%; height: 90%; object-fit: contain;">
        </body>
        </html>
    `);
    newWindow.document.close();
}


// =================================================================
// 4. KÓD KONVERTORU (NAŠE LOGIKA)
// =================================================================

// --- Hlavní Funkce Konvertoru ---
function runConversion(surovaData) {
    if (!surovaData) {
        console.error("Konverze selhala: Chybí surová data.");
        return null;
    }

    console.log("Spouštím konverzi surových dat...");
    
    const width = surovaData.width;
    const height = surovaData.height;
    const data = surovaData.data;
    const newFinalMap = []; 

    for (let y = 0; y < height; y++) {
        const newRow = [];
        for (let x = 0; x < width; x++) {
            const suroveID = data[y][x];
            let finalID = suroveID; 

            if (suroveID === C.ZEME_SUROVE) {
                const masky = Logika.calculateMask_pro_Zem(x, y, data, width, height);
                if (masky.hory > 0) finalID = Slovnik.mapMaskToTileID_Hory(masky.hory);
                else if (masky.voda > 0) finalID = Slovnik.mapMaskToTileID_Voda(masky.voda);
                else finalID = C.ID_PLNA_ZEM;
            } 
            else if (suroveID === C.CESTA_SUROVE) {
                const maska = Logika.calculateMask_pro_Overlay(x, y, data, width, height, C.CESTA_SUROVE);
                finalID = Slovnik.mapMaskToTileID_Cesta(maska);
            }
            else if (suroveID === C.MESTSKA_CESTA_SUROVE) {
                const maska_Vnitrni = Logika.calculateMask_Distance(x, y, data, width, height, C.PARK_SUROVE, 1);
                if (maska_Vnitrni > 0) {
                    finalID = Slovnik.mapMaskToTileID_CestaVnitrni(maska_Vnitrni);
                } else {
                    const maska_Vnejsi = Logika.calculateMask_Distance(x, y, data, width, height, C.PARK_SUROVE, 2);
                    if (maska_Vnejsi > 0) {
                        finalID = Slovnik.mapMaskToTileID_CestaVnejsi(maska_Vnejsi);
                    } else {
                        finalID = C.ID_PLNA_MESTSKA_CESTA; 
                    }
                }
            }
            else if (suroveID === C.LES_SUROVE) {
                const maska = Logika.calculateMask_pro_Overlay(x, y, data, width, height, C.LES_SUROVE);
                finalID = Slovnik.mapMaskToTileID_Les(maska);
            }
            else if (suroveID === C.VODA_SUROVE) finalID = C.ID_PLNA_VODA;
            else if (suroveID === C.HORY_SUROVE) finalID = C.ID_PLNA_HORA;
            else if (suroveID === C.PARK_SUROVE) finalID = C.ID_PLNA_PARK;
            else if (C.BUDOUCI_OVERLAYE.includes(suroveID)) finalID = suroveID;

            newRow.push(finalID);
        }
        newFinalMap.push(newRow);
    }
    
    console.log("Konverze dokončena.");
    return newFinalMap; // Vrátíme finální data
}

// --- Export Finálního PNG ---
function exportFinalPNG() {
    if (!finalMapData) {
        alert("Nejprve musíte spustit 'Konvertovat a Vykreslit Finální Mapu'!");
        return;
    }
    
    // Použijeme plátno finálního renderu
    const dataUrl = finalRenderCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = "mapa_finalni.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log("Finální PNG mapa exportována.");
}

// =================================================================
// 5. PŘIPOJENÍ EVENT LISTENERŮ
// =================================================================

// --- Listenery Generátoru ---
generateTerrainButton.addEventListener('click', generateTerrain);
addCityButton.addEventListener('click', addCity);
undoCityButton.addEventListener('click', undoCity); 
createRoadButton.addEventListener('click', createRoad); 
saveSettingsButton.addEventListener('click', saveSettings);
loadSettingsButton.addEventListener('click', loadSettings);
addResourceButton.addEventListener('click', () => createResourceRow('#FF0000', 0.8, 1.0));

// Export Surových dat
exportSurovyJsonButton.addEventListener('click', exportSurovyJSON);
exportSurovyPngButton.addEventListener('click', exportSurovyPNG);

// --- Listenery Konvertoru ---
tilesetFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) { loadedTilesetImage = null; return; }
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            loadedTilesetImage = img; 
            console.log("Tileset obrázek načten.");
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

runConversionButton.addEventListener('click', () => {
    if (!loadedTilesetImage) {
        alert("Nejprve nahraj Tileset obrázek!");
        return;
    }
    if (currentMapData.length === 0) {
        alert("Nejprve musíš vygenerovat terén (Tlačítko 1)!");
        return;
    }
    
    // 1. Spustíme konverzi
    // Předáme kopii surových dat, aby konvertor neměnil originál
    const surovaKopie = { 
        width: currentMapWidth, 
        height: currentMapHeight, 
        data: currentMapData.map(row => [...row]) 
    };
    const GDevelopMapa = runConversion(surovaKopie);
    
    if (!GDevelopMapa) return; // runConversion selhal

    // 2. Uložíme data pro export
    finalMapData = GDevelopMapa;
    
    // 3. Vykreslíme
    const tileSize = parseInt(tileSizeInput.value);
    const tilesetWidth = parseInt(tilesetWidthInput.value);
    renderMap(finalMapData, loadedTilesetImage, finalRenderCanvas, tileSize, tilesetWidth);
});

// --- Listenery Finálního Exportu ---
exportFinalJsonButton.addEventListener('click', () => {
    if (!finalMapData) {
        alert("Nejprve musíte spustit 'Konvertovat a Vykreslit Finální Mapu'!");
        return;
    }
    
    const finalJsonData = {
        width: finalMapData[0].length,
        height: finalMapData.length,
        data: finalMapData
    };
    
    const jsonString = JSON.stringify(finalJsonData);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a'); 
    a.href = url;
    a.download = "mapa_finalni_GDEVELOP.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("Finální JSON pro GDevelop exportován.");
});

exportFinalPngButton.addEventListener('click', exportFinalPNG);

// --- Ostatní Listenery (UI) ---
waterLevelSlider.addEventListener('input', () => { waterValueSpan.textContent = waterLevelSlider.value; });
mountainLevelSlider.addEventListener('input', () => { mountainValueSpan.textContent = mountainLevelSlider.value; });
forestFrequencySlider.addEventListener('input', () => { forestFrequencyValueSpan.textContent = parseFloat(forestFrequencySlider.value).toFixed(2); });
forestSizeSlider.addEventListener('input', () => { forestSizeValueSpan.textContent = parseFloat(forestSizeSlider.value).toFixed(2); });

cityStartXSlider.addEventListener('input', () => { cityStartXInput.value = cityStartXSlider.value; redrawMapWithMarker(); });
cityStartXInput.addEventListener('input', () => { cityStartXSlider.value = cityStartXInput.value; redrawMapWithMarker(); });
cityStartYSlider.addEventListener('input', () => { cityStartYInput.value = cityStartYSlider.value; redrawMapWithMarker(); });
cityStartYInput.addEventListener('input', () => { cityStartYSlider.value = cityStartYInput.value; redrawMapWithMarker(); });

turnPenaltySlider.addEventListener('input', () => { turnPenaltyValue.textContent = parseFloat(turnPenaltySlider.value).toFixed(1); });

setRoadStartButton.addEventListener('click', () => {
    roadStartPoint = { x: parseInt(cityStartXInput.value), y: parseInt(cityStartYInput.value) };
    roadStartDisplay.value = `Start: [${roadStartPoint.x}, ${roadStartPoint.y}]`;
});
setRoadEndButton.addEventListener('click', () => {
    roadEndPoint = { x: parseInt(cityStartXInput.value), y: parseInt(cityStartYInput.value) };
    roadEndDisplay.value = `Konec: [${roadEndPoint.x}, ${roadEndPoint.y}]`;
});

// --- První spuštění ---
if (!loadSettings()) {
    createResourceRow('#1C1C1C', 0.88, 1.0); // Uhlí
    createResourceRow('#2980b9', 0.0, 0.12); // Železo
}
generateTerrain();

</script>
</body>
</html>