export const GameData = {
    hulls: { 
        "hunter": { name: "Охотник", hp: 150, armor: { front: 50, side: 30, rear: 20 }, speed: 50, size: {w: 80, h: 60}, hitbox: {w: 70, h: 52}, ability: "Нет", cost: 0, 
            upgrades: { hp: 15, armor: { front: 5, side: 3, rear: 2 }, speed: 5 } },
        "leopard": { name: "Леопард", hp: 120, armor: { front: 30, side: 30, rear: 30 }, speed: 80, size: {w: 80, h: 60}, hitbox: {w: 66, h: 46}, ability: "Защитный дрон", cost: 15,
            upgrades: { hp: 10, armor: { front: 3, side: 3, rear: 3 }, speed: 7 } },
        "titan": { name: "Титан", hp: 180, armor: { front: 60, side: 40, rear: 30 }, speed: 44, size: {w: 80, h: 60}, hitbox: {w: 74, h: 54}, ability: "Мина-паук", cost: 15,
            upgrades: { hp: 18, armor: { front: 6, side: 4, rear: 3 }, speed: 4 } }
    },
    turrets: { 
        "scourge": { name: "Плеть", fireRate: 1.0, penetration: 80, burstCount: 1, burstDelay: 0, bulletRadius: 2.5, bulletColor: '#ffaa00', shootSound: 'cannon', bulletSpeed: 400, cost: 0,
            upgrades: { penetration: 5, fireRate: -0.05 } } 
    },
    enemyHulls: { 
        "basic": { name: "Враг-Базовый", hp: 100, armor: { front: 60, side: 30, rear: 15 }, speed: 45, size: {w: 80, h: 60}, hitbox: {w: 70, h: 52} },
        "scout": { name: "Скаут", hp: 90, armor: { front: 40, side: 40, rear: 40 }, speed: 60, size: {w: 80, h: 60}, hitbox: {w: 65, h: 48} },
        "demon": { name: "Демон", hp: 120, armor: { front: 40, side: 30, rear: 10 }, speed: 65, size: {w: 80, h: 60}, hitbox: {w: 66, h: 45} }
    },
    enemyTurrets: { 
        "basic": { name: "Враг-Пушка", fireRate: 3.5, penetration: 60, burstCount: 1, burstDelay: 0, bulletRadius: 2.5, bulletColor: '#ff5500', shootSound: 'cannon', bulletSpeed: 400 },
        "scout": { name: "Скаут-Автопушка", fireRate: 2.0, penetration: 35, burstCount: 3, burstDelay: 0.15, bulletRadius: 1.5, bulletColor: '#ffffdd', shootSound: 'mg', bulletSpeed: 400 },
        "demon": { name: "Демон-Пушка", fireRate: 5.0, penetration: 120, burstCount: 1, burstDelay: 0, bulletRadius: 3.5, bulletColor: '#ff0000', shootSound: 'cannon', bulletSpeed: 800 }
    }
};

export let PlayerProgress = {
    points: 0,
    unlockedLevel: 1,2,3,4,5,6,
    passedLevels: [],
    unlockedHulls: ["hunter"],
    unlockedTurrets: ["scourge"],
    currentAssembly: { hullId: "hunter", turretId: "scourge" },
    hullsHp: { "hunter": 150, "leopard": 120, "titan": 180 },
    
    // ИНВЕНТАРЬ ДЛЯ АПГРЕЙДОВ
    inventory: { hullUpgrades: 0, turretUpgrades: 0 },
    
    // СОСТОЯНИЕ ПРОКАЧКИ КАЖДОЙ ДЕТАЛИ (сколько раз нажали "плюсик")
    partStats: {
        "hunter": { hp: 0, armor: 0, speed: 0, maxCapacity: 3, usedCapacity: 0 },
        "leopard": { hp: 0, armor: 0, speed: 0, maxCapacity: 3, usedCapacity: 0 },
        "titan": { hp: 0, armor: 0, speed: 0, maxCapacity: 3, usedCapacity: 0 },
        "scourge": { penetration: 0, fireRate: 0, maxCapacity: 3, usedCapacity: 0 }
    },
    
    // СКОЛЬКО ЗВЕЗД СОБРАНО НА КАЖДОМ УРОВНЕ
    collectedStars: { 1: 0, 2: 0, 3: 0, 4: 0 } 
};

export const LevelsConfig = { 
    1: { pool: ["basic", "basic", "basic", "basic"], obstacles: 3, barrels: 0, maxUpgrades: 2 }, 
    2: { pool: ["basic", "basic", "basic", "scout", "scout"], obstacles: 4, barrels: 0, maxUpgrades: 2 }, 
    3: { pool: ["basic", "basic", "basic", "scout", "scout", "scout"], obstacles: 5, barrels: 0, maxUpgrades: 2 },
    4: { pool: ["demon", "demon", "basic", "basic", "scout", "scout"], obstacles: 6, barrels: 0, maxUpgrades: 2 },
    5: { pool: ["demon", "demon", "demon", "scout", "scout", "scout"], obstacles: 2, barrels: 0, maxUpgrades: 2 },
    // НОВЫЙ 6 УРОВЕНЬ: 7 скаутов и 7 бочек с горючим!
    6: { pool: ["scout", "scout", "scout", "scout", "scout", "scout", "scout"], obstacles: 5, barrels: 10, maxUpgrades: 3 }
};
