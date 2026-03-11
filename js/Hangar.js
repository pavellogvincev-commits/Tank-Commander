import { GameData, PlayerProgress } from './GameData.js';

export const screens = { 
    hangar: document.getElementById('hangar-screen'), 
    levels: document.getElementById('levels-screen'), 
    game: document.getElementById('gameCanvas') 
};

export function showScreen(screenName) { 
    screens.hangar.style.display = screenName === 'hangar' ? 'flex' : 'none'; 
    screens.levels.style.display = screenName === 'levels' ? 'flex' : 'none'; 
    screens.game.style.display = screenName === 'game' ? 'block' : 'none'; 
}

let selectedTab = 'hulls';
let selectedPartId = 'hunter';
let onStartLevelCallback = null;

export function initHangarUI(startLevelFn) {
    onStartLevelCallback = startLevelFn;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedTab = e.target.dataset.tab;
            selectedPartId = selectedTab === 'hulls' ? PlayerProgress.currentAssembly.hullId : PlayerProgress.currentAssembly.turretId;
            updateHangarUI();
        };
    });

    document.getElementById('heal-btn').onclick = () => {
        const hullId = PlayerProgress.currentAssembly.hullId;
        const maxHp = GameData.hulls[hullId].hp;
        if (PlayerProgress.points >= 1 && PlayerProgress.hullsHp[hullId] < maxHp) {
            PlayerProgress.points -= 1;
            PlayerProgress.hullsHp[hullId] = Math.min(maxHp, PlayerProgress.hullsHp[hullId] + Math.floor(maxHp * 0.2));
            updateHangarUI();
        }
    };

    document.getElementById('to-levels-btn').onclick = () => { generateLevelsGrid(); showScreen('levels'); };
    document.getElementById('back-to-hangar-btn').onclick = () => { showScreen('hangar'); updateHangarUI(); };

    updateHangarUI();
}

export function updateHangarUI() {
    document.getElementById('player-points').innerText = PlayerProgress.points;
    const assembly = PlayerProgress.currentAssembly;
    const hullData = GameData.hulls[assembly.hullId];
    
    document.getElementById('current-hp-val').innerText = PlayerProgress.hullsHp[assembly.hullId];
    document.getElementById('max-hp-val').innerText = hullData.hp;

    // Динамическое обновление картинок в центральном круге
    document.getElementById('hangar-hull-layer').src = `assets/${assembly.hullId === 'hunter' ? 'hull' : assembly.hullId}.png`;
    
    renderPartsList();
    showPartDetails(selectedPartId);
}

function renderPartsList() {
    const list = document.getElementById('parts-list');
    list.innerHTML = '';
    const dataGroup = GameData[selectedTab];

    for (let id in dataGroup) {
        const item = dataGroup[id];
        const div = document.createElement('div');
        let isEquipped = (selectedTab === 'hulls' && PlayerProgress.currentAssembly.hullId === id) || (selectedTab === 'turrets' && PlayerProgress.currentAssembly.turretId === id);
        div.className = `part-item ${selectedPartId === id ? 'selected' : ''} ${isEquipped ? 'equipped' : ''}`;
        
        const isUnlocked = selectedTab === 'hulls' ? PlayerProgress.unlockedHulls.includes(id) : PlayerProgress.unlockedTurrets.includes(id);
        if (!isUnlocked) div.classList.add('locked');

        div.innerHTML = `<span>${item.name}</span>`;
        if (!isUnlocked) div.innerHTML += `<span class="part-price">${item.cost} ⚙️</span>`;

        div.onclick = () => { selectedPartId = id; updateHangarUI(); };
        list.appendChild(div);
    }
}

function showPartDetails(id) {
    const item = GameData[selectedTab][id];
    document.getElementById('det-name').innerText = item.name;
    document.getElementById('det-hp').innerText = item.hp ? item.hp : '-';
    document.getElementById('det-armor').innerText = item.armor ? `${item.armor.front}/${item.armor.side}/${item.armor.rear}` : '-';
    document.getElementById('det-speed').innerText = item.speed ? item.speed : '-';
    document.getElementById('det-ability').innerText = item.ability ? item.ability : 'Нет';

    const actionArea = document.getElementById('action-area');
    actionArea.innerHTML = '';

    const isUnlocked = selectedTab === 'hulls' ? PlayerProgress.unlockedHulls.includes(id) : PlayerProgress.unlockedTurrets.includes(id);
    const isEquipped = (selectedTab === 'hulls' && PlayerProgress.currentAssembly.hullId === id) || (selectedTab === 'turrets' && PlayerProgress.currentAssembly.turretId === id);

    if (!isUnlocked) {
        const btn = document.createElement('button');
        btn.className = 'buy-btn';
        btn.innerText = `КУПИТЬ ЗА ${item.cost} ⚙️`;
        btn.onclick = () => {
            if (PlayerProgress.points >= item.cost) {
                PlayerProgress.points -= item.cost;
                if (selectedTab === 'hulls') PlayerProgress.unlockedHulls.push(id);
                else PlayerProgress.unlockedTurrets.push(id);
                updateHangarUI();
            }
        };
        actionArea.appendChild(btn);
    } else if (!isEquipped) {
        const btn = document.createElement('button');
        btn.className = 'equip-btn';
        btn.innerText = 'УСТАНОВИТЬ';
        btn.onclick = () => {
            if (selectedTab === 'hulls') PlayerProgress.currentAssembly.hullId = id;
            else PlayerProgress.currentAssembly.turretId = id;
            updateHangarUI();
        };
        actionArea.appendChild(btn);
    }
}

// ОБНОВЛЕНО: Добавлено слово export
export function generateLevelsGrid() { 
    const grid = document.getElementById('levels-grid'); grid.innerHTML = ''; 
    for (let i = 1; i <= 100; i++) { 
        let btn = document.createElement('button'); 
        if (PlayerProgress.passedLevels.includes(i)) btn.className = 'level-btn passed'; 
        else if (i <= PlayerProgress.unlockedLevel) btn.className = 'level-btn unlocked'; 
        else btn.className = 'level-btn locked'; 
        btn.innerHTML = `<div>${i}</div>`; 
        if (i <= PlayerProgress.unlockedLevel) {
            btn.onclick = () => { if (onStartLevelCallback) onStartLevelCallback(i); };
        }
        grid.appendChild(btn); 
    } 
}
