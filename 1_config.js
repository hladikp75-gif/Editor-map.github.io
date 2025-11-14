// ==========================================
// 1. DEFINICE TERÉNŮ (SUROVÁ ID)
// ==========================================
        
export const ZEME_SUROVE = 1;
export const VODA_SUROVE = 0;
export const HORY_SUROVE = 2;
export const LES_SUROVE = 3;
export const CESTA_SUROVE = 100;          // Polní cesta
export const MESTSKA_CESTA_SUROVE = 105;  // Cesta ve městě
export const PARK_SUROVE = 120;           // Park

export const BUDOUCI_OVERLAYE = [];       // Např. [4, 5] pro Keře, Pole

export const TEREN_MIMO_MAPU = ZEME_SUROVE; // Okraj mapy se tváří jako Země

// ==========================================
// 2. ID PRO FINÁLNÍ MAPU
// ==========================================
export const ID_PLNA_ZEM = 22;
export const ID_PLNA_VODA = 19;
export const ID_PLNA_HORA = 55;
export const ID_PLNA_LES = 557;
export const ID_PLNA_CESTA = 101;
export const ID_PLNA_MESTSKA_CESTA = 105; // Asfalt bez okrajů (daleko od parku)
export const ID_PLNA_PARK = 400;          // Finální ID pro Park

// Barvy Města (pro surový náhled generátoru)
export const COLOR_ROAD = '#404040';
export const COLOR_PARK = '#27ae60';
