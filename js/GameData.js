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
        // Переименовали в "Плеть"
        "scourge": { name: "Плеть", fireRate: 1.2, penetration: 80, burstCount: 1, burstDelay: 0, bulletRadius: 3, bulletColor: '#ffcc00', shootSound: 'cannon', bulletSpeed: 500, cost: 0, ability: "Нет",
            upgrades: { penetration: 8, fireRate: -0.07 } },
        // ГАТЛИНГ: fireRate 0.04, скорость 800, разброс (spread) 0.08
        "gatling": { name: "Гатлинг", fireRate: 0.06, reloadTime: 5.0, magazineSize: 40, penetration: 25, spread: 0.17, bulletRadius: 1.5, bulletColor: '#ffffdd', shootSound: 'mg', bulletSpeed: 800, cost: 10, ability: "Барабан на 30 выстр.",
            upgrades: { penetration: 5, magazineSize: 10 } }
    },
    enemyHulls: { 
        "basic": { name: "Враг-Базовый", hp: 100, armor: { front: 60, side: 30, rear: 15 }, speed: 45, size: {w: 80, h: 60}, hitbox: {w: 70, h: 52} },
        "scout": { name: "Скаут", hp: 90, armor: { front: 40, side: 40, rear: 40 }, speed: 60, size: {w: 80, h: 60}, hitbox: {w: 65, h: 48} },
        "demon": { name: "Демон", hp: 120, armor: { front: 40, side: 30, rear: 10 }, speed: 65, size: {w: 80, h: 60}, hitbox: {w: 66, h: 45} },
        "mars": { name: "Марс", hp: 140, armor: { front: 70, side: 35, rear: 10 }, speed: 20, size: {w: 85, h: 65}, hitbox: {w: 77, h: 54} }
    },
    enemyTurrets: { 
        "basic": { name: "Враг-Пушка", fireRate: 3.5, penetration: 60, burstCount: 1, burstDelay: 0, bulletRadius: 2.5, bulletColor: '#ff5500', shootSound: 'cannon', bulletSpeed: 400 },
        "scout": { name: "Скаут-Автопушка", fireRate: 2.0, penetration: 35, burstCount: 3, burstDelay: 0.15, bulletRadius: 1.5, bulletColor: '#ffffdd', shootSound: 'mg', bulletSpeed: 400 },
        "demon": { name: "Демон-Пушка", fireRate: 5.0, penetration: 120, burstCount: 1, burstDelay: 0, bulletRadius: 3.5, bulletColor: '#ff0000', shootSound: 'cannon', bulletSpeed: 800 },
        "mars": { name: "Артиллерия", fireRate: 5.0, penetration: 0, burstCount: 1, burstDelay: 0, bulletRadius: 5.0, bulletColor: '#333333', shootSound: 'cannon', bulletSpeed: 250 }
    }
};

export const LevelsConfig = { 
    1: { pool: ["basic", "basic", "basic", "basic"], obstacles: 3, barrels: 0, maxUpgrades: 2 }, 
    2: { pool: ["basic", "basic", "basic", "scout", "scout"], obstacles: 4, barrels: 1, maxUpgrades: 2 }, 
    3: { pool: ["basic", "basic", "basic", "scout", "scout", "scout"], obstacles: 5, barrels: 2, maxUpgrades: 2 },
    4: { pool: ["demon", "demon", "basic", "basic", "scout", "scout"], obstacles: 6, barrels: 3, maxUpgrades: 2 },
    5: { pool: ["demon", "demon", "demon", "scout", "scout", "scout"], obstacles: 2, barrels: 4, maxUpgrades: 2 },
    6: { pool: ["scout", "scout", "scout", "scout", "scout", "scout", "scout"], obstacles: 5, barrels: 7, maxUpgrades: 2 },
    7: { pool: ["demon", "scout", "basic", "demon", "scout", "basic"], obstacles: 4, barrels: 5, maxUpgrades: 2 },
    8: { pool: ["mars", "mars", "basic", "scout", "scout"], obstacles: 6, barrels: 3, maxUpgrades: 2 },
    9: { pool: ["scout", "scout", "scout", "demon", "mars", "mars"], obstacles: 3, barrels: 6, maxUpgrades: 2 },
    10: { pool: ["mars", "mars", "mars", "demon", "demon"], obstacles: 5, barrels: 8, maxUpgrades: 3 }
};

export let PlayerProgress = {
    points: 500, unlockedLevel: 10, passedLevels: [], collectedStars: {},
    inventory: { hullUpgrades: 5, turretUpgrades: 5 }, unlockedHulls: ["hunter"], unlockedTurrets: ["scourge"],
    currentAssembly: { hullId: "hunter", turretId: "scourge" }, hullsHp: { "hunter": 150, "leopard": 120, "titan": 180 },
    partStats: {
        "hunter": { maxCapacity: 2, usedCapacity: 0, hp: 0, armor: 0, speed: 0 },
        "leopard": { maxCapacity: 2, usedCapacity: 0, hp: 0, armor: 0, speed: 0 },
        "titan": { maxCapacity: 2, usedCapacity: 0, hp: 0, armor: 0, speed: 0 },
        "scourge": { maxCapacity: 2, usedCapacity: 0, penetration: 0, fireRate: 0 },
        "gatling": { maxCapacity: 2, usedCapacity: 0, penetration: 0, magazineSize: 0 }
    }
};
