export const GameData = {
    hulls: { 
        "hunter": { name: "Охотник", hp: 150, armor: { front: 60, side: 30, rear: 20 }, speed: 50, size: {w: 60, h: 45}, hitbox: {w: 50, h: 35}, ability: "Нет", cost: 0 },
        "leopard": { name: "Леопард", hp: 120, armor: { front: 40, side: 40, rear: 40 }, speed: 65, size: {w: 55, h: 40}, hitbox: {w: 45, h: 30}, ability: "Защитный дрон", cost: 15 },
        "titan": { name: "Титан", hp: 180, armor: { front: 70, side: 60, rear: 30 }, speed: 44, size: {w: 65, h: 50}, hitbox: {w: 55, h: 40}, ability: "Мина-паук", cost: 15 }
    },
    turrets: { 
        "scourge": { name: "Плеть", fireRate: 1.0, penetration: 80, burstCount: 1, burstDelay: 0, bulletRadius: 2.5, bulletColor: '#ffaa00', shootSound: 'cannon', cost: 0 } 
    },
    enemyHulls: { 
        "basic": { name: "Враг-Базовый", hp: 100, armor: { front: 60, side: 30, rear: 15 }, speed: 45, size: {w: 80, h: 60}, hitbox: {w: 70, h: 52} },
        "scout": { name: "Скаут", hp: 90, armor: { front: 40, side: 40, rear: 40 }, speed: 60, size: {w: 60, h: 45}, hitbox: {w: 45, h: 29} } 
    },
    enemyTurrets: { 
        "basic": { name: "Враг-Пушка", fireRate: 1.5, penetration: 60, burstCount: 1, burstDelay: 0, bulletRadius: 2.5, bulletColor: '#ff5500', shootSound: 'cannon' },
        "scout": { name: "Скаут-Автопушка", fireRate: 2.0, penetration: 35, burstCount: 3, burstDelay: 0.15, bulletRadius: 1.5, bulletColor: '#ffffdd', shootSound: 'mg' } 
    }
};

export let PlayerProgress = {
    points: 0,
    unlockedLevel: 1,
    passedLevels: [],
    unlockedHulls: ["hunter"],
    unlockedTurrets: ["scourge"],
    currentAssembly: { hullId: "hunter", turretId: "scourge" },
    hullsHp: { "hunter": 150, "leopard": 120, "titan": 180 }
};

export const LevelsConfig = { 
    1: { pool: ["basic", "basic", "basic", "basic"], obstacles: 3 }, 
    2: { pool: ["basic", "basic", "basic", "scout", "scout"], obstacles: 4 }, 
    3: { pool: ["basic", "basic", "basic", "scout", "scout", "scout"], obstacles: 5 }
};
