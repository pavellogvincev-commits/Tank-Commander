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
    
    document.getElementById('reset-progress-btn').onclick = () => {
        if (confirm("ВНИМАНИЕ! Это действие удалит все детали, звезды и прохождение. Вы начнете с нуля. Продолжить?")) {
            resetProgress(); selectedPartId = 'hunter'; updateHangarUI();
        }
    };

    document.getElementById('heal-btn').onclick = () => {
        const hullId = PlayerProgress.currentAssembly.hullId; const maxHp = GameData.hulls[hullId].hp + (PlayerProgress.partStats[hullId].hp * (GameData.hulls[hullId].upgrades.hp || 0));
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
    let hId = assembly.hullId; let tId = assembly.turretId;
    const hData = GameData.hulls[hId]; const tData = GameData.turrets[tId];
    const sHull = PlayerProgress.partStats[hId]; const sTurr = PlayerProgress.partStats[tId];

    const maxHp = hData.hp + (sHull.hp * (hData.upgrades.hp || 0));
    
    let hullImg = document.getElementById('hangar-hull-layer');
    hullImg.src = `assets/${hId === 'hunter' ? 'hull' : hId}.png`;

    let turretImg = document.getElementById('hangar-turret-layer');
    if (!turretImg && hullImg) {
        turretImg = document.createElement('img'); turretImg.id = 'hangar-turret-layer';
        hullImg.parentElement.appendChild(turretImg);
    }
    let tImgName = tId;
    if (tId === 'scourge') tImgName = 'turret';
    if (turretImg) turretImg.src = `assets/${tImgName}.png`;

    let armorF = hData.armor.front + ((sHull.armor || 0) * (hData.upgrades.armor?.front || 0));
    let armorS = hData.armor.side + ((sHull.armor || 0) * (hData.upgrades.armor?.side || 0));
    let armorR = hData.armor.rear + ((sHull.armor || 0) * (hData.upgrades.armor?.rear || 0));
    let speedVal = hData.speed + ((sHull.speed || 0) * (hData.upgrades.speed || 0));
    let frVal = tData.fireRate + ((sTurr.fireRate || 0) * (tData.upgrades.fireRate || 0));

    let statsHtml = `
        <div class="assembly-stat-row"><span>Прочность:</span> <span>${PlayerProgress.hullsHp[hId]} / ${maxHp}</span></div>
        <div class="assembly-stat-row"><span>Броня:</span> <span>${armorF}/${armorS}/${armorR}</span></div>
        <div class="assembly-stat-row"><span>Скорость:</span> <span>${speedVal}</span></div>
    `;

    if (tId !== "gatling") {
        statsHtml += `<div class="assembly-stat-row"><span>Скорострел.:</span> <span>${frVal.toFixed(2)}с</span></div>`;
    }

    if (tId === "howitzer") {
        let dmgVal = tData.damage + ((sTurr.damage || 0) * (tData.upgrades.damage || 0));
        let radVal = tData.explosionRadius + ((sTurr.explosionRadius || 0) * (tData.upgrades.explosionRadius || 0));
        statsHtml += `<div class="assembly-stat-row" style="color:#ff5555;"><span>Взрыв (Урон):</span> <span style="color:#ff5555;">${dmgVal}</span></div>`;
        statsHtml += `<div class="assembly-stat-row" style="color:#ffaa00;"><span>Взрыв (Радиус):</span> <span style="color:#ffaa00;">${radVal}</span></div>`;
    } else if (tId === "gatling") {
        let penVal = tData.penetration + ((sTurr.penetration || 0) * (tData.upgrades.penetration || 0));
        statsHtml += `<div class="assembly-stat-row" style="color:#ff5555;"><span>Урон (сквозь броню):</span> <span style="color:#ff5555;">${penVal}</span></div>`;
    } else {
        let penVal = tData.penetration + ((sTurr.penetration || 0) * (tData.upgrades.penetration || 0));
        statsHtml += `<div class="assembly-stat-row"><span>Пробитие:</span> <span>${penVal}</span></div>`;
    }

    if (hId === "titan") {
        let minD = 30 + ((sHull.mineDamage || 0) * 8); let maxD = 60 + ((sHull.mineDamage || 0) * 15);
        statsHtml += `<div class="assembly-stat-row" style="color:#ffcc00;"><span>Урон мин:</span> <span style="color:#ffcc00;">${minD} - ${maxD}</span></div>`;
    } else if (hId === "leopard") {
        statsHtml += `<div class="assembly-stat-row" style="color:#00ffcc;"><span>Оглушение:</span> <span style="color:#00ffcc;">${7 + ((sHull.stunDuration || 0) * 1)}с</span></div>`;
    }
    
    if (tId === "gatling") {
        let magVal = tData.magazineSize + ((sTurr.magazineSize || 0) * (tData.upgrades.magazineSize || 0));
        let relVal = tData.reloadTime + ((sTurr.reloadTime || 0) * (tData.upgrades.reloadTime || 0));
        statsHtml += `<div class="assembly-stat-row" style="color:#ffffdd;"><span>Барабан:</span> <span style="color:#ffffdd;">${magVal}</span></div>`;
        statsHtml += `<div class="assembly-stat-row" style="color:#ffffdd;"><span>Перезарядка:</span> <span style="color:#ffffdd;">${relVal.toFixed(2)}с</span></div>`;
    }

    document.getElementById('assembly-stats').innerHTML = statsHtml;
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

        if (item.upgrades.hp !== undefined) html += `<div class="upgrade-row"><span>Здоровье: <span id="val-hp" class="upgrade-val">${item.hp + ((stats.hp || 0) * item.upgrades.hp)}</span></span></div>`;
        if (item.upgrades.armor !== undefined) html += `<div class="upgrade-row"><span>Броня: <span id="val-armor" class="upgrade-val">${item.armor.front + ((stats.armor || 0) * item.upgrades.armor.front)}/${item.armor.side + ((stats.armor || 0) * item.upgrades.armor.side)}/${item.armor.rear + ((stats.armor || 0) * item.upgrades.armor.rear)}</span></span></div>`;
        if (item.upgrades.speed !== undefined) html += `<div class="upgrade-row"><span>Скорость: <span id="val-speed" class="upgrade-val">${item.speed + ((stats.speed || 0) * item.upgrades.speed)}</span></span></div>`;
        if (item.upgrades.stunDuration !== undefined) html += `<div class="upgrade-row"><span>Оглушение: <span id="val-stunDuration" class="upgrade-val">${7 + ((stats.stunDuration || 0) * item.upgrades.stunDuration)}с</span></span></div>`;
        if (item.upgrades.mineDamage !== undefined) html += `<div class="upgrade-row"><span>Урон мин: <span id="val-mineDamage" class="upgrade-val">${30 + ((stats.mineDamage || 0) * 8)} - ${60 + ((stats.mineDamage || 0) * 15)}</span></span></div>`;
        
        if (id === "gatling") {
            if (item.upgrades.penetration !== undefined) html += `<div class="upgrade-row"><span>Урон (сквозь броню): <span id="val-penetration" class="upgrade-val">${item.penetration + ((stats.penetration || 0) * item.upgrades.penetration)}</span></span></div>`;
        } else {
            if (item.upgrades.penetration !== undefined) html += `<div class="upgrade-row"><span>Пробитие: <span id="val-penetration" class="upgrade-val">${item.penetration + ((stats.penetration || 0) * item.upgrades.penetration)}</span></span></div>`;
        }
        
        if (item.upgrades.damage !== undefined) html += `<div class="upgrade-row"><span>Взрывной урон: <span id="val-damage" class="upgrade-val">${item.damage + ((stats.damage || 0) * item.upgrades.damage)}</span></span></div>`;
        if (item.upgrades.explosionRadius !== undefined) html += `<div class="upgrade-row"><span>Радиус взрыва: <span id="val-explosionRadius" class="upgrade-val">${item.explosionRadius + ((stats.explosionRadius || 0) * item.upgrades.explosionRadius)}</span></span></div>`;
        
        if (item.upgrades.fireRate !== undefined && id !== "gatling") html += `<div class="upgrade-row"><span>Перезарядка: <span id="val-fireRate" class="upgrade-val">${(item.fireRate + ((stats.fireRate || 0) * item.upgrades.fireRate)).toFixed(2)}с</span></span></div>`;
        if (item.upgrades.reloadTime !== undefined) html += `<div class="upgrade-row"><span>Время перезарядки: <span id="val-reloadTime" class="upgrade-val">${(item.reloadTime + ((stats.reloadTime || 0) * item.upgrades.reloadTime)).toFixed(2)}с</span></span></div>`;
        if (item.upgrades.magazineSize !== undefined) html += `<div class="upgrade-row"><span>Боезапас: <span id="val-magazineSize" class="upgrade-val">${item.magazineSize + ((stats.magazineSize || 0) * item.upgrades.magazineSize)}</span></span></div>`;

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
        PlayerProgress.inventory[type]--; 
        if(PlayerProgress.partStats[id][randomStat] === undefined) PlayerProgress.partStats[id][randomStat] = 0;
        PlayerProgress.partStats[id][randomStat]++; 
        PlayerProgress.partStats[id].usedCapacity++;
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
