import { GameData, PlayerProgress, LevelsConfig } from './GameData.js';

export const screens = { hangar: document.getElementById('hangar-screen'), levels: document.getElementById('levels-screen'), game: document.getElementById('gameCanvas') };
export function showScreen(screenName) { screens.hangar.style.display = screenName === 'hangar' ? 'flex' : 'none'; screens.levels.style.display = screenName === 'levels' ? 'flex' : 'none'; screens.game.style.display = screenName === 'game' ? 'block' : 'none'; }

let selectedTab = 'hulls'; let selectedPartId = 'hunter'; let onStartLevelCallback = null; let lastUpgradedStatId = null;

export function initHangarUI(startLevelFn) {
    onStartLevelCallback = startLevelFn;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); 
            selectedTab = e.target.dataset.tab; selectedPartId = selectedTab === 'hulls' ? PlayerProgress.currentAssembly.hullId : PlayerProgress.currentAssembly.turretId;
            updateHangarUI();
        };
    });
    document.getElementById('heal-btn').onclick = () => {
        const hullId = PlayerProgress.currentAssembly.hullId; const maxHp = GameData.hulls[hullId].hp + (PlayerProgress.partStats[hullId].hp * GameData.hulls[hullId].upgrades.hp);
        if (PlayerProgress.points >= 1 && PlayerProgress.hullsHp[hullId] < maxHp) { PlayerProgress.points -= 1; PlayerProgress.hullsHp[hullId] = Math.min(maxHp, PlayerProgress.hullsHp[hullId] + Math.floor(maxHp * 0.2)); updateHangarUI(); }
    };
    document.getElementById('to-levels-btn').onclick = () => { generateLevelsGrid(); showScreen('levels'); };
    document.getElementById('back-to-hangar-btn').onclick = () => { showScreen('hangar'); updateHangarUI(); };
    updateHangarUI();
}

export function updateHangarUI() {
    document.getElementById('player-points').innerText = PlayerProgress.points;
    document.getElementById('inv-hull-val').innerText = PlayerProgress.inventory.hullUpgrades;
    document.getElementById('inv-turret-val').innerText = PlayerProgress.inventory.turretUpgrades;
    const assembly = PlayerProgress.currentAssembly;
    const baseHp = GameData.hulls[assembly.hullId].hp; const bonusHp = PlayerProgress.partStats[assembly.hullId].hp * GameData.hulls[assembly.hullId].upgrades.hp;
    document.getElementById('current-hp-val').innerText = PlayerProgress.hullsHp[assembly.hullId]; document.getElementById('max-hp-val').innerText = baseHp + bonusHp;
    document.getElementById('hangar-hull-layer').src = `assets/${assembly.hullId === 'hunter' ? 'hull' : assembly.hullId}.png`;
    renderPartsList(); showPartDetails(selectedPartId);
}

function renderPartsList() {
    const list = document.getElementById('parts-list'); list.innerHTML = ''; const dataGroup = GameData[selectedTab];
    for (let id in dataGroup) {
        const item = dataGroup[id]; const div = document.createElement('div');
        let isEquipped = (selectedTab === 'hulls' && PlayerProgress.currentAssembly.hullId === id) || (selectedTab === 'turrets' && PlayerProgress.currentAssembly.turretId === id);
        div.className = `part-item ${selectedPartId === id ? 'selected' : ''} ${isEquipped ? 'equipped' : ''}`;
        const isUnlocked = selectedTab === 'hulls' ? PlayerProgress.unlockedHulls.includes(id) : PlayerProgress.unlockedTurrets.includes(id);
        if (!isUnlocked) div.classList.add('locked');
        div.innerHTML = `<span>${item.name}</span>`; if (!isUnlocked) div.innerHTML += `<span class="part-price">${item.cost} ⚙️</span>`;
        div.onclick = () => { selectedPartId = id; updateHangarUI(); }; list.appendChild(div);
    }
}

function showPartDetails(id) {
    const item = GameData[selectedTab][id]; const isUnlocked = selectedTab === 'hulls' ? PlayerProgress.unlockedHulls.includes(id) : PlayerProgress.unlockedTurrets.includes(id);
    const isEquipped = (selectedTab === 'hulls' && PlayerProgress.currentAssembly.hullId === id) || (selectedTab === 'turrets' && PlayerProgress.currentAssembly.turretId === id);
    const stats = PlayerProgress.partStats[id];
    let imgSrc = `assets/${id}.png`; if (id === 'hunter') imgSrc = 'assets/hull.png'; if (id === 'scourge') imgSrc = 'assets/turret.png';
    let html = ``;

    if (isUnlocked) {
        html += `<div class="details-image-box"><img src="${imgSrc}" alt="${item.name}"><div class="details-level-text">${item.name} ур. ${stats.usedCapacity}/${stats.maxCapacity}</div></div>`;
        let expandCost = stats.maxCapacity + 1;
        html += `<div style="text-align:center; margin-bottom: 15px;"><button class="expand-btn" onclick="expandCapacity('${id}', ${expandCost})">Расширить потенциал (${expandCost} ⚙️)</button></div>`;
        let canUpgrade = stats.usedCapacity < stats.maxCapacity; let pointsType = selectedTab === 'hulls' ? 'hullUpgrades' : 'turretUpgrades'; let hasPoints = PlayerProgress.inventory[pointsType] > 0;

        if (selectedTab === 'hulls') {
            html += `<div class="upgrade-row"><span>Здоровье: <span id="val-hp" class="upgrade-val">${item.hp + (stats.hp * item.upgrades.hp)}</span></span></div>`;
            html += `<div class="upgrade-row"><span>Броня: <span id="val-armor" class="upgrade-val">${item.armor.front + (stats.armor * item.upgrades.armor.front)}/${item.armor.side + (stats.armor * item.upgrades.armor.side)}/${item.armor.rear + (stats.armor * item.upgrades.armor.rear)}</span></span></div>`;
            html += `<div class="upgrade-row"><span>Скорость: <span id="val-speed" class="upgrade-val">${item.speed + (stats.speed * item.upgrades.speed)}</span></span></div>`;
        } else {
            html += `<div class="upgrade-row"><span>Пробитие: <span id="val-penetration" class="upgrade-val">${item.penetration + (stats.penetration * item.upgrades.penetration)}</span></span></div>`;
            // УМНАЯ ОТРИСОВКА СТАТОВ
            if (item.upgrades.fireRate) {
                html += `<div class="upgrade-row"><span>Перезарядка: <span id="val-fireRate" class="upgrade-val">${(item.fireRate + (stats.fireRate * item.upgrades.fireRate)).toFixed(2)}с</span></span></div>`;
            }
            if (item.upgrades.magazineSize) {
                html += `<div class="upgrade-row"><span>Боезапас: <span id="val-magazineSize" class="upgrade-val">${item.magazineSize + (stats.magazineSize * item.upgrades.magazineSize)}</span></span></div>`;
            }
        }

        if (canUpgrade && hasPoints) html += `<button class="random-upgrade-btn" onclick="buyRandomUpgrade('${id}')">СЛУЧАЙНЫЙ АПГРЕЙД (1 ★)</button>`;
        else if (!hasPoints && canUpgrade) html += `<button class="random-upgrade-btn" disabled>НЕТ ЗВЕЗД ДЛЯ АПГРЕЙДА</button>`;
        else if (!canUpgrade) html += `<button class="random-upgrade-btn" disabled>ПОТЕНЦИАЛ ИСЧЕРПАН</button>`;

        if (stats.usedCapacity > 0) {
            let resetCost = stats.usedCapacity * 3; let canReset = PlayerProgress.points >= resetCost;
            html += `<button class="reset-upgrade-btn" ${canReset ? '' : 'disabled'} onclick="resetUpgrades('${id}', ${resetCost})">ИЗВЛЕЧЬ ЗВЕЗДЫ (${resetCost} ⚙️)</button>`;
        }
    } else {
        html += `<div class="details-image-box"><img src="${imgSrc}" alt="${item.name}" style="filter: brightness(0.3) drop-shadow(0px 10px 10px rgba(0,0,0,0.8));"><div class="details-level-text" style="color:#666;">${item.name} (Заблокировано)</div></div>`;
        html += `<p>Особенность: ${item.ability || '-'}</p>`;
    }

    html += `<p style="margin-top:15px; font-size:14px;">Особенность: <span style="color: #00ffcc;">${item.ability || 'Нет'}</span></p><div id="action-area" class="action-area"></div>`;
    document.getElementById('details-info').innerHTML = html;

    if (lastUpgradedStatId) { let el = document.getElementById(lastUpgradedStatId); if (el) el.classList.add('stat-flash'); lastUpgradedStatId = null; }
    const actionArea = document.getElementById('action-area');
    if (!isUnlocked) {
        const btn = document.createElement('button'); btn.className = 'buy-btn'; btn.innerText = `КУПИТЬ ЗА ${item.cost} ⚙️`;
        btn.onclick = () => { if (PlayerProgress.points >= item.cost) { PlayerProgress.points -= item.cost; if (selectedTab === 'hulls') PlayerProgress.unlockedHulls.push(id); else PlayerProgress.unlockedTurrets.push(id); updateHangarUI(); } }; actionArea.appendChild(btn);
    } else if (!isEquipped) {
        const btn = document.createElement('button'); btn.className = 'equip-btn'; btn.innerText = 'УСТАНОВИТЬ';
        btn.onclick = () => { if (selectedTab === 'hulls') PlayerProgress.currentAssembly.hullId = id; else PlayerProgress.currentAssembly.turretId = id; updateHangarUI(); }; actionArea.appendChild(btn);
    }
}

window.resetUpgrades = function(id, cost) {
    if (PlayerProgress.points >= cost && PlayerProgress.partStats[id].usedCapacity > 0) {
        PlayerProgress.points -= cost;
        let type = GameData.hulls[id] ? 'hullUpgrades' : 'turretUpgrades';
        PlayerProgress.inventory[type] += PlayerProgress.partStats[id].usedCapacity;
        PlayerProgress.partStats[id].usedCapacity = 0;
        
        // УМНЫЙ СБРОС (сбрасывает только те ключи, которые есть в upgrades)
        let itemData = GameData.hulls[id] || GameData.turrets[id];
        for (let key in itemData.upgrades) {
            PlayerProgress.partStats[id][key] = 0;
        }
        updateHangarUI();
    }
}

window.buyRandomUpgrade = function(id) {
    let type = GameData.hulls[id] ? 'hullUpgrades' : 'turretUpgrades';
    if (PlayerProgress.inventory[type] > 0 && PlayerProgress.partStats[id].usedCapacity < PlayerProgress.partStats[id].maxCapacity) {
        // УМНЫЙ ВЫБОР АПГРЕЙДА
        let statsOptions = GameData.hulls[id] ? ['hp', 'armor', 'speed'] : Object.keys(GameData.turrets[id].upgrades);
        let randomStat = statsOptions[Math.floor(Math.random() * statsOptions.length)];
        PlayerProgress.inventory[type]--; PlayerProgress.partStats[id][randomStat]++; PlayerProgress.partStats[id].usedCapacity++;
        lastUpgradedStatId = `val-${randomStat}`; updateHangarUI();
    }
}

window.expandCapacity = function(id, cost) { if (PlayerProgress.points >= cost) { PlayerProgress.points -= cost; PlayerProgress.partStats[id].maxCapacity++; updateHangarUI(); } }

export function generateLevelsGrid() { 
    const grid = document.getElementById('levels-grid'); grid.innerHTML = ''; 
    for (let i = 1; i <= 10; i++) { 
        let btn = document.createElement('button'); let classes = 'level-btn';
        if (PlayerProgress.passedLevels.includes(i)) classes += ' passed'; else if (i <= PlayerProgress.unlockedLevel) classes += ' unlocked'; else classes += ' locked'; 
        let starsHtml = ''; if (LevelsConfig[i]) { let max = LevelsConfig[i].maxUpgrades; let collected = PlayerProgress.collectedStars[i] || 0; starsHtml = `<div class="level-stars">`; for(let s=0; s<max; s++) { starsHtml += `<span class="star ${s < collected ? 'gold' : ''}">★</span>`; } starsHtml += `</div>`; }
        btn.className = classes; btn.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center;"><div>${i}</div>${starsHtml}</div>`; 
        if (i <= PlayerProgress.unlockedLevel) { btn.onclick = () => { if (onStartLevelCallback) onStartLevelCallback(i); }; }
        grid.appendChild(btn); 
    } 
}
