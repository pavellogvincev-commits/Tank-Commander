export const GameData = {
    hulls: { 
        "hunter": { name: "Охотник", hp: 150, armor: { front: 50, side: 30, rear: 20 }, speed: 50, size: {w: 80, h: 60}, hitbox: {w: 70, h: 52}, ability: "Нет", cost: 0, 
            upgrades: { hp: 15, armor: { front: 5, side: 3, rear: 2 }, speed: 5 } },
        "leopard": { name: "Леопард", hp: 120, armor: { front: 30, side: 30, rear: 30 }, speed: 80, size: {w: 80, h: 60}, hitbox: {w: 66, h: 46}, ability: "ЭМИ-Дрон (12 сек)", cost: 15,
            upgrades: { hp: 10, stunDuration: 1, speed: 7 } },
        "titan": { name: "Титан", hp: 200, armor: { front: 65, side: 40, rear: 35 }, speed: 44, size: {w: 80, h: 60}, hitbox: {w: 74, h: 54}, ability: "Мина-паук (6 шт)", cost: 15,
            upgrades: { hp: 25, armor: { front: 7, side: 6, rear: 5 }, mineDamage: 1 } }
    },
    turrets: { 
        "scourge": { name: "Плеть", fireRate: 2.0, penetration: 80, burstCount: 1, burstDelay: 0, bulletRadius: 3, bulletColor: '#ffcc00', shootSound: 'cannon', bulletSpeed: 500, cost: 0, ability: "Нет",
            upgrades: { penetration: 6, fireRate: -0.06 } },
        // ГАТЛИНГ: Особенность теперь - игнор брони
        "gatling": { name: "Гатлинг", fireRate: 0.1, reloadTime: 4.5, magazineSize: 55, penetration: 6, spread: 0.1, bulletRadius: 1.5, bulletColor: '#ffffdd', shootSound: 'mg', bulletSpeed: 800, cost: 10, ability: "Игнорирует броню",
            upgrades: { reloadTime: -0.25, magazineSize: 10 } },
        "howitzer": { name: "Гаубица", fireRate: 4.0, damage: 90, explosionRadius: 100, spread: 55, bulletRadius: 4.0, bulletColor: '#222222', shootSound: 'cannon', bulletSpeed: 300, cost: 10, ability: "Стрельба навесом",
            upgrades: { damage: 7, explosionRadius: 10 } }
    },
    enemyHulls: { 
        "basic": { name: "Враг-Базовый", hp: 100, armor: { front: 60, side: 30, rear: 15 }, speed: 45, size: {w: 80, h: 60}, hitbox: {w: 70, h: 52} },
        "scout": { name: "Скаут", hp: 90, armor: { front: 40, side: 40, rear: 40 }, speed: 60, size: {w: 80, h: 60}, hitbox: {w: 65, h: 48} },
        "demon": { name: "Демон", hp: 120, armor: { front: 40, side: 30, rear: 10 }, speed: 65, size: {w: 80, h: 60}, hitbox: {w: 66, h: 45} },
        "mars": { name: "Марс", hp: 140, armor: { front: 70, side: 35, rear: 25 }, speed: 20, size: {w: 85, h: 65}, hitbox: {w: 77, h: 54} },
        "goliaph": { name: "Голиаф", hp: 250, armor: { front: 120, side: 80, rear: 66 }, speed: 15, size: {w: 90, h: 68}, hitbox: {w: 90, h: 50} }
    },
    enemyTurrets: { 
        "basic": { name: "Враг-Пушка", fireRate: 3.5, penetration: 60, burstCount: 1, burstDelay: 0, bulletRadius: 2.5, bulletColor: '#ff5500', shootSound: 'cannon', bulletSpeed: 400 },
        "scout": { name: "Скаут-Автопушка", fireRate: 2.0, penetration: 35, burstCount: 3, burstDelay: 0.15, bulletRadius: 1.5, bulletColor: '#ffffdd', shootSound: 'mg', bulletSpeed: 400 },
        "demon": { name: "Демон-Пушка", fireRate: 5.0, penetration: 120, burstCount: 1, burstDelay: 0, bulletRadius: 3.5, bulletColor: '#ff0000', shootSound: 'cannon', bulletSpeed: 800 },
        "mars": { name: "Артиллерия", fireRate: 5.0, penetration: 0, burstCount: 1, burstDelay: 0, bulletRadius: 5.0, bulletColor: '#333333', shootSound: 'cannon', bulletSpeed: 200 },
        "goliaph": { name: "Голиаф-Пушка", fireRate: 3.5, penetration: 88, burstCount: 1, burstDelay: 0, bulletRadius: 4.0, bulletColor: '#ff3300', shootSound: 'cannon', bulletSpeed: 450 }
    }
};

export const LevelsConfig = { 
    1: { pool: ["basic", "basic", "basic"], obstacles: 3, barrels: 0, maxUpgrades: 2 }, 
    2: { pool: ["basic", "basic", "basic", "scout"], obstacles: 4, barrels: 1, maxUpgrades: 2 }, 
    3: { pool: ["basic", "basic", "basic", "scout", "scout", "scout"], obstacles: 5, barrels: 2, maxUpgrades: 2 },
    4: { pool: ["demon", "basic", "basic", "scout", "scout"], obstacles: 6, barrels: 3, maxUpgrades: 2 },
    5: { pool: ["demon", "demon", "scout", "scout", "scout"], obstacles: 2, barrels: 4, maxUpgrades: 2 },
    6: { pool: ["scout", "scout", "scout", "scout", "scout"], obstacles: 5, barrels: 2, maxUpgrades: 2, fastSpawn: true },
    7: { pool: ["demon", "scout", "basic", "demon", "scout", "basic"], obstacles: 4, barrels: 5, maxUpgrades: 2 },
    8: { pool: ["mars", "basic", "basic", "scout", "scout", "scout"], obstacles: 6, barrels: 3, maxUpgrades: 2 },
    9: { pool: ["scout", "scout", "scout", "scout", "demon", "demon", "mars", "mars"], obstacles: 3, barrels: 6, maxUpgrades: 2, fastSpawn: true },
    10: { pool: ["mars", "mars", "mars", "demon", "demon", "demon", "basic", "basic", "scout", "scout"], obstacles: 5, barrels: 10, maxUpgrades: 3 },
    11: { pool: ["goliaph", "basic", "scout", "scout", "demon"], obstacles: 5, barrels: 4, maxUpgrades: 3 },
    12: { pool: ["goliaph", "mars", "scout", "scout", "demon", "basic"], obstacles: 6, barrels: 3, maxUpgrades: 3, fastSpawn: true },
    13: { pool: ["goliaph", "goliaph", "basic", "basic", "mars", "mars"], obstacles: 4, barrels: 5, maxUpgrades: 3 },
    14: { pool: ["demon", "demon", "demon", "goliaph", "scout", "scout", "scout"], obstacles: 7, barrels: 6, maxUpgrades: 3 },
    15: { pool: ["goliaph", "goliaph", "goliaph", "mars", "mars", "demon", "demon"], obstacles: 3, barrels: 8, maxUpgrades: 4, fastSpawn: true }
};

const defaultProgress = {
    points: 0, unlockedLevel: 1, passedLevels: [], collectedStars: {},
    inventory: { hullUpgrades: 0, turretUpgrades: 0 }, unlockedHulls: ["hunter"], unlockedTurrets: ["scourge"],
    currentAssembly: { hullId: "hunter", turretId: "scourge" }, hullsHp: { "hunter": 150, "leopard": 120, "titan": 200 },
    partStats: {
        "hunter": { maxCapacity: 5, usedCapacity: 0, hp: 0, armor: 0, speed: 0 },
        "leopard": { maxCapacity: 5, usedCapacity: 0, hp: 0, stunDuration: 0, speed: 0 },
        "titan": { maxCapacity: 5, usedCapacity: 0, hp: 0, armor: 0, mineDamage: 0 },
        "scourge": { maxCapacity: 3, usedCapacity: 0, penetration: 0, fireRate: 0 },
        "gatling": { maxCapacity: 3, usedCapacity: 0, reloadTime: 0, magazineSize: 0 },
        "howitzer": { maxCapacity: 3, usedCapacity: 0, damage: 0, explosionRadius: 0 } 
    }
};

export let PlayerProgress = JSON.parse(JSON.stringify(defaultProgress));

export function loadProgress() {
    const saved = localStorage.getItem('tankCommanderSave_v2');
    if (saved) {
        try {
            let parsed = JSON.parse(saved);
            for (let key in parsed) { PlayerProgress[key] = parsed[key]; }
            if (PlayerProgress.partStats.gatling.magazineSize === undefined) PlayerProgress.partStats.gatling.magazineSize = 0;
            if (PlayerProgress.partStats.gatling.reloadTime === undefined) PlayerProgress.partStats.gatling.reloadTime = 0;
            if (PlayerProgress.partStats.titan.mineDamage === undefined) PlayerProgress.partStats.titan.mineDamage = PlayerProgress.partStats.titan.speed || 0;
            if (PlayerProgress.partStats.howitzer === undefined) PlayerProgress.partStats.howitzer = { maxCapacity: 3, usedCapacity: 0, damage: 0, explosionRadius: 0 };
        } catch (e) { console.error("Ошибка загрузки сохранения", e); }
    }
}

export function saveProgress() { localStorage.setItem('tankCommanderSave_v2', JSON.stringify(PlayerProgress)); }
export function resetProgress() {
    localStorage.removeItem('tankCommanderSave_v2');
    let freshProgress = JSON.parse(JSON.stringify(defaultProgress));
    for (let key in freshProgress) { PlayerProgress[key] = freshProgress[key]; }
}

loadProgress();
