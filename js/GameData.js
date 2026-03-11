export const GameData = {
    hulls: { 
        "hunter": { name: "Охотник", hp: 150, armor: { front: 50, side: 30, rear: 20 }, speed: 50, size: {w: 80, h: 60}, hitbox: {w: 70, h: 52}, ability: "Нет", cost: 0 },
        "leopard": { name: "Леопард", hp: 120, armor: { front: 30, side: 30, rear: 30 }, speed: 65, size: {w: 80, h: 60}, hitbox: {w: 66, h: 46}, ability: "Защитный дрон", cost: 15 },
        "titan": { name: "Титан", hp: 180, armor: { front: 60, side: 40, rear: 30 }, speed: 44, size: {w: 80, h: 60}, hitbox: {w: 74, h: 54}, ability: "Мина-паук", cost: 15 }
    },
    turrets: { 
        "scourge": { name: "Плеть", fireRate: 1.0, penetration: 80, burstCount: 1, burstDelay: 0, bulletRadius: 2.5, bulletColor: '#ffaa00', shootSound: 'cannon', bulletSpeed: 400, cost: 0 } 
    },
    enemyHulls: { 
        "basic": { name: "Враг-Базовый", hp: 100, armor: { front: 60, side: 30, rear: 15 }, speed: 45, size: {w: 80, h: 60}, hitbox: {w: 70, h: 52} },
        "scout": { name: "Скаут", hp: 90, armor: { front: 40, side: 40, rear: 40 }, speed: 60, size: {w: 80, h: 60}, hitbox: {w: 65, h: 48} },
        "demon": { name: "Демон", hp: 120, armor: { front: 40, side: 30, rear: 10 }, speed: 65, size: {w: 80, h: 60}, hitbox: {w: 72, h: 50} }
    },
    enemyTurrets: { 
        "basic": { name: "Враг-Пушка", fireRate: 1.5, penetration: 60, burstCount: 1, burstDelay: 0, bulletRadius: 2.5, bulletColor: '#ff5500', shootSound: 'cannon', bulletSpeed: 400 },
        "scout": { name: "Скаут-Автопушка", fireRate: 2.0, penetration: 35, burstCount: 3, burstDelay: 0.15, bulletRadius: 1.5, bulletColor: '#ffffdd', shootSound: 'mg', bulletSpeed: 400 },
        "demon": { name: "Демон-Пушка", fireRate: 3.0, penetration: 90, burstCount: 1, burstDelay: 0, bulletRadius: 3.5, bulletColor: '#ff0000', shootSound: 'cannon', bulletSpeed: 600 }
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
    3: { pool: ["basic", "basic", "basic", "scout", "scout", "scout"], obstacles: 5 },
    4: { pool: ["demon", "demon", "basic", "basic", "scout", "scout"], obstacles: 6 }
};
