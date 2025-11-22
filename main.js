// ============================================
// 状態オブジェクト
// ============================================
let player = {
    group: null,
    commonCurrency: 0,
    // グループ通貨の個人残高（表示はしないが内部で管理）
    groupCurrencies: {
        A: 0,
        B: 0,
        C: 0,
        D: 0
    }
};

let groups = {
    A: { totalWealth: 0 },
    B: { totalWealth: 0 },
    C: { totalWealth: 0 },
    D: { totalWealth: 0 }
};

// 各グループ通貨 → Common のレート
let rates = {
    A: 1,
    B: 1,
    C: 1,
    D: 1
};

let clickCount = 0;

// ============================================
// DOM要素の取得
// ============================================
const groupSelectModal = document.getElementById('group-select-modal');
const gameContainer = document.getElementById('game-container');
const groupButtons = document.querySelectorAll('.group-btn');
const clickButton = document.getElementById('click-button');
const clickCountDisplay = document.getElementById('click-count');
const playerGroupDisplay = document.getElementById('player-group');
const playerCommonValue = document.getElementById('player-common-value');
const groupTableBody = document.getElementById('group-table-body');
const rateTableBody = document.getElementById('rate-table-body');
const tradeForm = document.getElementById('trade-form');
const tradeFrom = document.getElementById('trade-from');
const tradeTo = document.getElementById('trade-to');
const tradeAmount = document.getElementById('trade-amount');
const logArea = document.getElementById('log');

// ============================================
// 初期化関数
// ============================================
function init() {
    // グループ選択ボタンのイベントリスナー
    groupButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedGroup = e.target.dataset.group;
            selectGroup(selectedGroup);
        });
    });

    // クリックボタンのイベントリスナー
    clickButton.addEventListener('click', onClickButton);

    // トレードフォームのイベントリスナー
    tradeForm.addEventListener('submit', onTradeSubmit);

    // モックサーバーから初期状態を読み込む（実際はローカルで初期値セット）
    loadInitialState();
}

// グループ選択
function selectGroup(group) {
    player.group = group;
    groupSelectModal.style.display = 'none';
    gameContainer.style.display = 'flex';
    
    // プレイヤーグループの色を設定
    const groupColors = {
        A: '#ff6b6b',
        B: '#4ecdc4',
        C: '#45b7d1',
        D: '#f9ca24'
    };
    playerGroupDisplay.style.backgroundColor = groupColors[group];
    
    renderAll();
    addLog(`Group ${group} を選択しました`, 'success');
}

// 初期状態の読み込み（モック）
function loadInitialState() {
    // 初期値は既に設定済み（全て0、レートは1）
    // 将来的にサーバーから取得する処理に置き換え可能
}

// ============================================
// UI更新関数
// ============================================
function renderAll() {
    renderPlayerInfo();
    renderGroupTable();
    renderRateTable();
}

function renderPlayerInfo() {
    if (player.group) {
        playerGroupDisplay.textContent = `Group ${player.group}`;
        playerCommonValue.textContent = player.commonCurrency.toLocaleString();
    }
}

function renderGroupTable() {
    groupTableBody.innerHTML = '';
    
    Object.keys(groups).forEach(group => {
        const row = document.createElement('tr');
        const groupCell = document.createElement('td');
        const wealthCell = document.createElement('td');
        
        const badge = document.createElement('span');
        badge.className = `group-badge group-${group}`;
        badge.textContent = `Group ${group}`;
        groupCell.appendChild(badge);
        
        wealthCell.textContent = groups[group].totalWealth.toLocaleString();
        
        // プレイヤーの所属グループを強調
        if (group === player.group) {
            row.style.backgroundColor = '#e8f4f8';
            row.style.fontWeight = 'bold';
        }
        
        row.appendChild(groupCell);
        row.appendChild(wealthCell);
        groupTableBody.appendChild(row);
    });
}

function renderRateTable() {
    rateTableBody.innerHTML = '';
    
    Object.keys(rates).forEach(group => {
        const row = document.createElement('tr');
        const pairCell = document.createElement('td');
        const rateCell = document.createElement('td');
        
        pairCell.textContent = `${group} : Common`;
        rateCell.textContent = `1 : ${rates[group]}`;
        
        // プレイヤーの所属グループを強調
        if (group === player.group) {
            row.style.backgroundColor = '#e8f4f8';
            row.style.fontWeight = 'bold';
        }
        
        row.appendChild(pairCell);
        row.appendChild(rateCell);
        rateTableBody.appendChild(row);
    });
}

// ============================================
// イベントハンドラー
// ============================================
async function onClickButton() {
    if (!player.group) {
        addLog('エラー: グループが選択されていません', 'error');
        return;
    }
    
    try {
        // モックAPIを呼び出し
        const result = await mockClick(player, groups);
        
        // 状態を更新
        player = result.player;
        groups = result.groups;
        clickCount++;
        
        // UIを更新
        clickCountDisplay.textContent = clickCount;
        renderAll();
        
        addLog(`クリック！ Group ${player.group} の資産が増加しました`, 'success');
    } catch (error) {
        addLog(`エラー: ${error.message}`, 'error');
    }
}

async function onTradeSubmit(e) {
    e.preventDefault();
    
    if (!player.group) {
        addLog('エラー: グループが選択されていません', 'error');
        return;
    }
    
    const from = tradeFrom.value;
    const to = tradeTo.value;
    const amount = parseInt(tradeAmount.value);
    
    if (from === to) {
        addLog('エラー: From通貨とTo通貨が同じです', 'error');
        return;
    }
    
    if (amount <= 0) {
        addLog('エラー: 数量は1以上を指定してください', 'error');
        return;
    }
    
    try {
        // モックAPIを呼び出し
        const result = await mockTrade(player, from, to, amount, rates);
        
        // 状態を更新
        player = result.player;
        groups = result.groups;
        rates = result.rates;
        
        // UIを更新
        renderAll();
        
        addLog(`トレード成功: ${amount} ${from} → ${to}`, 'success');
        
        // フォームをリセット
        tradeAmount.value = '1';
    } catch (error) {
        addLog(`エラー: ${error.message}`, 'error');
    }
}

// ============================================
// モックサーバー関数（Promiseを返す）
// ============================================
async function mockClick(player, groups) {
    // 非同期処理をシミュレート（実際のサーバー呼び出しに置き換え可能）
    return new Promise((resolve) => {
        setTimeout(() => {
            // プレイヤーの所属グループの資産を+1
            const updatedGroups = { ...groups };
            updatedGroups[player.group].totalWealth += 1;
            
            // プレイヤーの個人資産も+1（共通通貨）
            const updatedPlayer = {
                ...player,
                commonCurrency: player.commonCurrency + 1
            };
            
            resolve({
                player: updatedPlayer,
                groups: updatedGroups
            });
        }, 100); // 100msの遅延でサーバー通信をシミュレート
    });
}

async function mockTrade(player, from, to, amount, rates) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // 残高チェック
            if (from === 'Common') {
                if (player.commonCurrency < amount) {
                    reject(new Error('残高不足: Common通貨が足りません'));
                    return;
                }
            } else {
                // プレイヤー個人のグループ通貨残高をチェック
                if (player.groupCurrencies[from] < amount) {
                    reject(new Error(`残高不足: Group ${from}通貨が足りません`));
                    return;
                }
            }
            
            // レートを取得
            let rate;
            if (from === 'Common') {
                // Common → グループ通貨: 1 / rate
                rate = 1 / rates[to];
            } else if (to === 'Common') {
                // グループ通貨 → Common: rate
                rate = rates[from];
            } else {
                // グループ通貨 → グループ通貨（簡易実装: Common経由）
                rate = rates[from] / rates[to];
            }
            
            const receivedAmount = Math.floor(amount * rate);
            
            // 資産を更新
            const updatedPlayer = {
                ...player,
                groupCurrencies: { ...player.groupCurrencies }
            };
            const updatedGroups = { ...groups };
            const updatedRates = { ...rates };
            
            // From通貨を減らす
            if (from === 'Common') {
                updatedPlayer.commonCurrency -= amount;
            } else {
                updatedPlayer.groupCurrencies[from] -= amount;
            }
            
            // To通貨を増やす
            if (to === 'Common') {
                updatedPlayer.commonCurrency += receivedAmount;
            } else {
                updatedPlayer.groupCurrencies[to] += receivedAmount;
            }
            
            // レートを更新（グループ通貨 ↔ Common のみ）
            if (from !== 'Common' && to === 'Common') {
                // グループ通貨を売ってCommonを買う → グループ通貨安・Common高
                updatedRates[from] = Math.min(4, Math.max(1, updatedRates[from] + 1));
            } else if (from === 'Common' && to !== 'Common') {
                // Commonを売ってグループ通貨を買う → グループ通貨高・Common低
                updatedRates[to] = Math.min(4, Math.max(1, updatedRates[to] - 1));
            }
            
            resolve({
                player: updatedPlayer,
                groups: updatedGroups,
                rates: updatedRates
            });
        }, 100);
    });
}

// ============================================
// ログ機能
// ============================================
function addLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    logArea.insertBefore(logEntry, logArea.firstChild);
    
    // ログが多すぎる場合は古いものを削除
    while (logArea.children.length > 20) {
        logArea.removeChild(logArea.lastChild);
    }
}

// ============================================
// 初期化実行
// ============================================
// DOMContentLoadedを待つ（defer属性があるので通常は不要だが、念のため）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
