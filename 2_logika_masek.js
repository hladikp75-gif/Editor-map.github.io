// Importujeme sdílené konstanty
import * as C from './1_config.js';

// ==========================================
// 3. POMOCNÉ FUNKCE
// ==========================================

export function getNeighbor_Standard(x, y, data, width, height, fallbackID) {
    if (y < 0 || y >= height || x < 0 || x >= width) {
        return fallbackID;
    }
    return data[y][x];
}

export function getNeighbor_pro_Zem(x, y, data, width, height) {
    if (y < 0 || y >= height || x < 0 || x >= width) {
        return C.TEREN_MIMO_MAPU;
    }
    const suroveID_souseda = data[y][x];
    // Ignorujeme overleye, pro zemi jsou neviditelné
    if (suroveID_souseda === C.LES_SUROVE || 
        suroveID_souseda === C.CESTA_SUROVE || 
        suroveID_souseda === C.MESTSKA_CESTA_SUROVE || 
        suroveID_souseda === C.PARK_SUROVE ||
        C.BUDOUCI_OVERLAYE.includes(suroveID_souseda)) 
    {
        return C.ZEME_SUROVE;
    }
    return suroveID_souseda;
}

// Maska pro Zemi (hledá Hory/Vodu, ignoruje Overlaye)
export function calculateMask_pro_Zem(x, y, data, width, height) {
    let maska_HORY = 0;
    let maska_VODA = 0;
    const bits = [1, 2, 4, 8, 16, 32, 64, 128];
    const coords = [[0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1]];

    for (let i = 0; i < 8; i++) {
        const nx = x + coords[i][0];
        const ny = y + coords[i][1];
        const sousedID = getNeighbor_pro_Zem(nx, ny, data, width, height); 

        if (sousedID === C.HORY_SUROVE) maska_HORY += bits[i];
        else if (sousedID === C.VODA_SUROVE) maska_VODA += bits[i];
    }
    return { hory: maska_HORY, voda: maska_VODA };
}

// Maska pro Overlay (hledá sám sebe)
export function calculateMask_pro_Overlay(x, y, data, width, height, targetID) {
    let maskValue = 0;
    const bits = [1, 2, 4, 8, 16, 32, 64, 128];
    const coords = [[0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1]];

    for (let i = 0; i < 8; i++) {
        const nx = x + coords[i][0];
        const ny = y + coords[i][1];
        if (getNeighbor_Standard(nx, ny, data, width, height, targetID) === targetID) {
            maskValue += bits[i];
        }
    }
    return maskValue;
}

// Maska na dálku (pro Městskou cestu a Park)
export function calculateMask_Distance(x, y, data, width, height, targetID, step) {
    let maskValue = 0;
    const bits = [1, 2, 4, 8, 16, 32, 64, 128];
    const coords = [[0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1]];

    for (let i = 0; i < 8; i++) {
        const nx = x + (coords[i][0] * step);
        const ny = y + (coords[i][1] * step);
        // Použijeme -1 jako fallback (mimo mapu park není)
        if (getNeighbor_Standard(nx, ny, data, width, height, -1) === targetID) {
            maskValue += bits[i];
        }
    }
    return maskValue;
}