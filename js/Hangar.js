import { GameData, PlayerProgress, LevelsConfig, saveProgress, resetProgress } from './GameData.js';

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
    
    // ОБРАБОТКА КНОПКИ СБРОСА ПРОГРЕССА
    document.getElementById('reset-progress-btn').onclick = () => {
        if (confirm("ВНИМАНИЕ! Это действие удалит все детали, звезды и прохождение. Вы начнете с нуля. Продолжить?")) {
            resetProgress();
            selectedPartId = 'hunter';
            updateHangarUI();
        }
    };

    document.getElementById('heal-btn').onclick = () => {
        const hullId = PlayerProgress.currentAssembly.hullId; const maxHp = GameData.hulls[hullId].hp + (PlayerProgress.partStats[hullId].hp * GameData.hulls[hullId].upgrades.hp);
        if (PlayerProgress.points >= 1 && PlayerProgress.hullsHp[hullId] < maxHp) { PlayerProgress.points -= 1; PlayerProgress.hullsHp[hullId] = Math.min(maxHp, PlayerProgress.hullsHp[hullId] + Math.floor(maxHp * 0.2)); updateHangarUI(); }
    };
    document.getElementById('to-levels-btn').onclick = () => { generateLevelsGrid(); showScreen('levels'); };
    document.getElementById('back-to-hangar-btn').onclick = () => { showScreen('hangar'); updateHangarUI(); };
    showScreen('hangar'); 
    updateHangarUI();
}

export function updateHangarUI() {
    saveProgress(); 
    
    document.getElementById('player-points').innerText = PlayerProgress.points;
    document.getElementById('inv-hull-val').innerText = PlayerProgress.inventory.hullUpgrades;
    document.getElementById('inv-turret-val').innerText = PlayerProgress.inventory.turretUpgrades;
    
    const assembly = PlayerProgress.currentAssembly;
    const baseHp = GameData.hulls[assembly.hullId].hp; const bonusHp = PlayerProgress.partStats[assembly.hullId].hp * GameData.hulls[assembly.hullId].upgrades.hp;
    document.getElementById('current-hp-val').innerText = PlayerProgress.hullsHp[assembly.hullId]; 
    document.getElementById('max-hp-val').innerText = baseHp + bonusHp;
    
    let hullImg = document.getElementById('hangar-hull-layer');
    let hId = assembly.hullId; let tId = assembly.turretId;
    hullImg.src = `assets/${hId === 'hunter' ? 'hull' : hId}.png`;

    let turretImg = document.getElementById('hangar-turret-layer');
    if (!turretImg && hullImg) {
        turretImg = document.createElement('img'); turretImg.id = 'hangar-turret-layer';
        hullImg.parentElement.appendChild(turretImg);
    }
    if (turretImg) turretImg.src = `assets/${tId === 'scourge' ? 'turret' : tId}.png`;

    renderPartsList(); showPartDetails(selectedPartId);
}

function renderPartsList() {
    const list = document.getElementById('parts-list'); list.innerHTML = ''; const dataGroup = GameData[selectedTab];
    for (let id in dataGroup) {
        const item = dataGroup[id]; const div = document.createElement('div');
        const stats = PlayerProgress.partStats[id];
        let isEquipped = (selectedTab === 'hulls' && PlayerProgress.currentAssembly.hullId === id) || (selectedTab === 'turrets' && PlayerProgress.currentAssembly.turretId === id);
        div.className = `part-item ${selectedPartId === id ? 'selected' : ''} ${isEquipped ? 'equipped' : ''}`;
        const isUnlocked = selectedTab === 'hulls' ? PlayerProgress.unlockedHulls.includes(id) : PlayerProgress.unlockedTurrets.includes(id);
        
        if (!isUnlocked) div.classList.add('locked');

        let innerHTML = `<div class="part-item-header">`;
        innerHTML += `<span class="part-item-name">${item.name}</span>`;
        if (isUnlocked) innerHTML += `<span class="part-item-level">Ур. ${stats.usedCapacity}/${stats.maxCapacity}</span>`;
        innerHTML += `</div>`;
        div.innerHTML = innerHTML;

        const actionDiv = document.createElement('div'); actionDiv.className = 'part-item-actions';

        if (!isUnlocked) {
            const buyBtn = document.createElement('button'); buyBtn.className = 'list-buy-btn'; buyBtn.innerText = `КУПИТЬ (${item.cost} ⚙️)`;
            buyBtn.onclick = (e) => { 
                e.stopPropagation(); 
                if (PlayerProgress.points >= item.cost) { PlayerProgress.points -= item.cost; if (selectedTab === 'hulls') PlayerProgress.unlockedHulls.push(id); else PlayerProgress.unlockedTurrets.push(id); selectedPartId = id; updateHangarUI(); } 
            };
            actionDiv.appendChild(buyBtn);
        } else if (!isEquipped) {
            const equipBtn = document.createElement('button'); equipBtn.className = 'list-equip-btn'; equipBtn.innerText = 'УСТАНОВИТЬ';
            equipBtn.onclick = (e) => { e.stopPropagation(); if (selectedTab === 'hulls') PlayerProgress.currentAssembly.hullId = id; else PlayerProgress.currentAssembly.turretId = id; selectedPartId = id; updateHangarUI(); };
            actionDiv.appendChild(equipBtn);
        } else {
            const equippedText = document.createElement('span'); equippedText.className = 'list-equipped-text'; equippedText.innerText = '✓ УСТАНОВЛЕНО';
            actionDiv.appendChild(equippedText);
        }
        
        div.appendChild(actionDiv); div.onclick = () => { selectedPartId = id; updateHangarUI(); }; list.appendChild(div);
    }
}

function showPartDetails(id) {
    const item = GameData[selectedTab][id]; const isUnlocked = selectedTab === 'hulls' ? PlayerProgress.unlockedHulls.includes(id) : PlayerProgress.unlockedTurrets.includes(id);
    const stats = PlayerProgress.partStats[id];
    let imgSrc = `assets/${id}.png`; if (id === 'hunter') imgSrc = 'assets/hull.png'; if (id === 'scourge') imgSrc = 'assets/turret.png';
    let html = ``;

    if (isUnlocked) {
        html += `<div class="details-image-box unlocked-box"><img src="${imgSrc}" alt="${item.name}"></div>`;
        html += `<div class="details-title">${item.name}</div>`;

        if (item.upgrades.hp) html += `<div class="upgrade-row"><span>Здоровье: <span id="val-hp" class="upgrade-val">${item.hp + (stats.hp * item.upgrades.hp)}</span></span></div>`;
        if (item.upgrades.armor) html += `<div class="upgrade-row"><span>Броня: <span id="val-armor" class="upgrade-val">${item.armor.front + (stats.armor * item.upgrades.armor.front)}/${item.armor.side + (stats.armor * item.upgrades.armor.side)}/${item.armor.rear + (stats.armor * item.upgrades.armor.rear)}</span></span></div>`;
        if (item.upgrades.speed) html += `<div class="upgrade-row"><span>Скорость: <span id="val-speed" class="upgrade-val">${item.speed + (stats.speed * item.upgrades.speed)}</span></span></div>`;
        if (item.upgrades.stunDuration) html += `<div class="upgrade-row"><span>Оглушение: <span id="val-stunDuration" class="upgrade-val">${7 + (stats.stunDuration * item.upgrades.stunDuration)}с</span></span></div>`;
        if (item.upgrades.mineDamage) html += `<div class="upgrade-row"><span>Урон мин: <span id="val-mineDamage" class="upgrade-val">${30 + (stats.mineDamage * 5)} - ${60 + (stats.mineDamage * 10)}</span></span></div>`;
        
        if (item.upgrades.penetration) html += `<div class="upgrade-row"><span>Пробитие: <span id="val-penetration" class="upgrade-val">${item.penetration + (stats.penetration * item.upgrades.penetration)}</span></span></div>`;
        if (item.upgrades.fireRate) html += `<div class="upgrade-row"><span>Перезарядка: <span id="val-fireRate" class="upgrade-val">${(item.fireRate + (stats.fireRate * item.upgrades.fireRate)).toFixed(2)}с</span></span></div>`;
        if (item.upgrades.magazineSize) html += `<div class="upgrade-row"><span>Боезапас: <span id="val-magazineSize" class="upgrade-val">${item.magazineSize + (stats.magazineSize * item.upgrades.magazineSize)}</span></span></div>`;

        html += `<p class="ability-text">Особенность: <span>${item.ability || 'Нет'}</span></p>`;

        let canUpgrade = stats.usedCapacity < stats.maxCapacity; let pointsType = selectedTab === 'hulls' ? 'hullUpgrades' : 'turretUpgrades'; let hasPoints = PlayerProgress.inventory[pointsType] > 0;
        
        if (canUpgrade && hasPoints) html += `<button class="random-upgrade-btn main-action-btn" onclick="buyRandomUpgrade('${id}')">СЛУЧАЙНЫЙ АПГРЕЙД (1 ★)</button>`;
        else if (!hasPoints && canUpgrade) html += `<button class="random-upgrade-btn main-action-btn" disabled>НЕТ ЗВЕЗД ДЛЯ АПГРЕЙДА</button>`;
        else if (!canUpgrade) html += `<button class="random-upgrade-btn main-action-btn" disabled>ПОТЕНЦИАЛ ИСЧЕРПАН</button>`;

        let maxLimit = selectedTab === 'hulls' ? 15 : 10;
        if (stats.maxCapacity < maxLimit) {
            let expandCost = stats.maxCapacity + 1;
            html += `<button class="expand-btn main-action-btn" onclick="expandCapacity('${id}', ${expandCost})">РАСШИРИТЬ ПОТЕНЦИАЛ (${expandCost} ⚙️)</button>`;
        } else {
            html += `<button class="expand-btn main-action-btn" disabled style="background:#333; color:#666; box-shadow:none;">МАКСИМАЛЬНЫЙ УРОВЕНЬ</button>`;
        }

        if (stats.usedCapacity > 0) {
            let resetCost = stats.usedCapacity * 3; let canReset = PlayerProgress.points >= resetCost;
            html += `<button class="reset-upgrade-btn small-action-btn" ${canReset ? '' : 'disabled'} onclick="resetUpgrades('${id}', ${resetCost})">Извлечь звезды (${resetCost} ⚙️)</button>`;
        }
    } else {
        html += `<div class="details-image-box locked-box"><img src="${imgSrc}" alt="${item.name}"></div>`;
        html += `<div class="details-title" style="color:#778877;">${item.name} (Заблокировано)</div>`;
        html += `<p class="ability-text">Особенность: <span>${item.ability || '-'}</span></p>`;
    }

    document.getElementById('details-info').innerHTML = html;
    if (lastUpgradedStatId) { let el = document.getElementById(lastUpgradedStatId); if (el) el.classList.add('stat-flash'); lastUpgradedStatId = null; }
}

window.resetUpgrades = function(id, cost) {
    if (PlayerProgress.points >= cost && PlayerProgress.partStats[id].usedCapacity > 0) {
        PlayerProgress.points -= cost; let type = GameData.hulls[id] ? 'hullUpgrades' : 'turretUpgrades';
        PlayerProgress.inventory[type] += PlayerProgress.partStats[id].usedCapacity; PlayerProgress.partStats[id].usedCapacity = 0;
        let itemData = GameData.hulls[id] || GameData.turrets[id]; for (let key in itemData.upgrades) { PlayerProgress.partStats[id][key] = 0; } updateHangarUI();
    }
}

window.buyRandomUpgrade = function(id) {
    let type = GameData.hulls[id] ? 'hullUpgrades' : 'turretUpgrades';
    if (PlayerProgress.inventory[type] > 0 && PlayerProgress.partStats[id].usedCapacity < PlayerProgress.partStats[id].maxCapacity) {
        let itemData = GameData.hulls[id] || GameData.turrets[id];
        let statsOptions = Object.keys(itemData.upgrades);
        
        let randomStat = statsOptions[Math.floor(Math.random() * statsOptions.length)];
        PlayerProgress.inventory[type]--; PlayerProgress.partStats[id][randomStat]++; PlayerProgress.partStats[id].usedCapacity++;
        lastUpgradedStatId = `val-${randomStat}`; updateHangarUI();
    }
}

window.expandCapacity = function(id, cost) { if (PlayerProgress.points >= cost) { PlayerProgress.points -= cost; PlayerProgress.partStats[id].maxCapacity++; updateHangarUI(); } }

export function generateLevelsGrid() { 
    const grid = document.getElementById('levels-grid'); grid.innerHTML = ''; 
    for (let i = 1; i <= 15; i++) { 
        let btn = document.createElement('button'); let classes = 'level-btn';
        if (PlayerProgress.passedLevels.includes(i)) classes += ' passed'; else if (i <= PlayerProgress.unlockedLevel) classes += ' unlocked'; else classes += ' locked'; 
        
        let starsHtml = ''; let levelTitle = i;
        if (LevelsConfig[i]) { 
            if (LevelsConfig[i].fastSpawn) levelTitle = `⚡ ${i} ⚡`;
            let max = LevelsConfig[i].maxUpgrades; let collected = PlayerProgress.collectedStars[i] || 0; 
            starsHtml = `<div class="level-stars">`; for(let s=0; s<max; s++) { starsHtml += `<span class="star ${s < collected ? 'gold' : ''}">★</span>`; } starsHtml += `</div>`; 
        }
        
        btn.className = classes; 
        btn.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center;"><div style="color:${LevelsConfig[i] && LevelsConfig[i].fastSpawn ? '#ffcc00' : 'inherit'};">${levelTitle}</div>${starsHtml}</div>`; 
        if (i <= PlayerProgress.unlockedLevel) { btn.onclick = () => { if (onStartLevelCallback) onStartLevelCallback(i); }; }
        grid.appendChild(btn); 
    } 
}
