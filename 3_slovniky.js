// Importujeme sdílené konstanty
import * as C from './1_config.js';

// ==========================================
// 4. PŘEKLADOVÉ SLOVNÍKY
// ==========================================

export function mapMaskToTileID_Voda(maska) {
    switch (maska) {
        case 0: return C.ID_PLNA_ZEM; 
        case 3: case 129: case 131: case 1: return 25;
        case 48: case 24: case 56: case 16: return 13;
        case 224: case 192: case 96: case 64: return 18;
        case 14: case 12: case 6: case 4: return 20;
        case 143: case 135: case 7: case 15: return 1;
        case 195: case 227: case 193: case 225: return 2;
        case 62: case 60: case 28: case 30: return 7;
        case 248: case 120: case 112: case 240: return 8;
        case 32: return 12;
        case 8: return 14;
        case 2: return 26;
        case 128: return 24;
        default: return 1; 
    }
}

export function mapMaskToTileID_Hory(maska) {
     switch (maska) {
        case 3: case 129: case 131: case 1: return 61;
        case 48: case 24: case 56: case 16: return 49;
        case 224: case 192: case 96: case 64: return 54;
        case 14: case 12: case 6: case 4: return 56;
        case 143: case 135: case 7: case 15: return 37;
        case 195: case 227: case 193: case 225: return 38;
        case 62: case 60: case 28: case 30: return 43;
        case 248: case 120: case 112: case 240: return 44;
        case 32: return 48;
        case 8: return 50;
        case 2: return 62;
        case 128: return 60;
        default: return 1;
    }
}

export function mapMaskToTileID_Cesta(maska) {
    switch (maska) {
        case 252: case 126: case 124: case 254: return 504;
        case 207: case 231: case 199: case 239: return 512;
        case 31: case 63: case 159: case 191: return 535;
        case 241: case 243: case 249: case 251: return 534;
        case 112: case 120: case 248: case 240: return 538;
        case 60: case 28: case 62: case 30: return 507;
        case 193: case 195: case 227: case 225: return 524;
        case 7: case 135: case 143: case 15: return 545;
        case 223: return 547;
        case 247: return 514;
        case 253: return 536;
        case 127: return 517;
    }
    return C.ID_PLNA_CESTA;
}

export function mapMaskToTileID_Les(maska) {
     switch (maska) {
        case 252: case 126: case 124: case 254: return 549;
        case 207: case 231: case 199: case 239: return 565;
        case 31: case 63: case 159: case 191: return 558;
        case 241: case 243: case 249: case 251: return 556;
        case 112: case 120: case 248: case 240: return 548;
        case 60: case 28: case 62: case 30: return 550;
        case 193: case 195: case 227: case 225: return 564;
        case 7: case 135: case 143: case 15: return 566;
        case 223: return 557;
        case 247: return 557;
        case 253: return 557;
        case 127: return 557;
    }
    return C.ID_PLNA_LES;
}

export function mapMaskToTileID_CestaVnitrni(maska) {
    switch (maska) {
        case 3: case 129: case 131: case 1: return 504; 
        case 48: case 24: case 56: case 16: return 512; 
        case 224: case 192: case 96: case 64: return 535; 
        case 14: case 12: case 6: case 4: return 534; 
        case 32: return 547;
        case 8: return 514;
        case 2: return 536;
        case 128: return 517;
    }
    return 600; // Fallback
}

export function mapMaskToTileID_CestaVnejsi(maska) {
    switch (maska) {
        case 3: case 129: case 131: case 1: return 512; 
        case 48: case 24: case 56: case 16: return 504; 
        case 224: case 192: case 96: case 64: return 535; 
        case 14: case 12: case 6: case 4: return 534; 
        case 32: return 538;
        case 8: return 507;
        case 2: return 545;
        case 128: return 524;
    }
    return 700; // Fallback
}