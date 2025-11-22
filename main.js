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
let lastClickTime = 0;
const CLICK_COOLDOWN = 200; // 0.2秒（200ミリ秒）

// ============================================
// DOM要素の取得
// ============================================
const groupSelectModal = document.getElementById('group-select-modal');
const gameContainer = document.getElementById('game-container');
const mainContent = document.querySelector('.main-content');
const header = document.querySelector('.header');
const footer = document.querySelector('.footer');
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
    clickButton.addEventListener('click', (e) => {
        e.stopPropagation(); // イベントの伝播を止める
        // クリックボタンの中心位置を取得
        const rect = clickButton.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        e.clientX = centerX;
        e.clientY = centerY;
        onClickButton(e);
    });

    // グループ選択モーダルのクリックイベントリスナー（最初の画面）
    groupSelectModal.addEventListener('click', (e) => {
        // ボタンなどのインタラクティブ要素をクリックした場合は無視
        if (e.target.closest('button') || 
            e.target.closest('input') || 
            e.target.closest('select') ||
            e.target.closest('a')) {
            return;
        }
        // モーダルが表示されている間はクリック無効（グループ選択のみ）
    });

    // ゲームコンテナ全体のクリックイベントリスナー（一画面全体）
    gameContainer.addEventListener('click', (e) => {
        // フォーム、ボタン、テーブル、リンクなどのインタラクティブ要素をクリックした場合は無視
        if (e.target.closest('form') || 
            e.target.closest('button') || 
            e.target.closest('input') || 
            e.target.closest('select') ||
            e.target.closest('table') ||
            e.target.closest('a')) {
            return;
        }
        onClickButton(e);
    });
    
    // ゲームコンテナ全体のタッチイベント（モバイル対応）
    gameContainer.addEventListener('touchend', (e) => {
        if (e.target.closest('form') || 
            e.target.closest('button') || 
            e.target.closest('input') || 
            e.target.closest('select') ||
            e.target.closest('table') ||
            e.target.closest('a')) {
            return;
        }
        e.preventDefault(); // デフォルトの動作を防ぐ
        onClickButton(e);
    }, { passive: false });

    // トレードフォームのイベントリスナー
    tradeForm.addEventListener('submit', onTradeSubmit);

    // モックサーバーから初期状態を読み込む（実際はローカルで初期値セット）
    loadInitialState();
    
    // iPad/iPhoneでのダブルタップ拡大を防止
    preventDoubleTapZoom();
}

// ダブルタップ拡大を防止する関数
function preventDoubleTapZoom() {
    let lastTouchEnd = 0;
    
    // ダブルタップを防止（インタラクティブ要素は除外）
    document.addEventListener('touchend', function(event) {
        // フォーム、ボタン、入力欄などのインタラクティブ要素は除外
        if (event.target.closest('form') || 
            event.target.closest('button') || 
            event.target.closest('input') || 
            event.target.closest('select') ||
            event.target.closest('a')) {
            return;
        }
        
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
    
    // gesturestartイベントを防止（iOS Safari）
    document.addEventListener('gesturestart', function(event) {
        event.preventDefault();
    }, { passive: false });
    
    document.addEventListener('gesturechange', function(event) {
        event.preventDefault();
    }, { passive: false });
    
    document.addEventListener('gestureend', function(event) {
        event.preventDefault();
    }, { passive: false });
    
    // ピンチズームを防止（2本指以上のタッチを防止）
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchmove', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });
    
    // wheelイベントでズームを防止（マウスホイール）
    document.addEventListener('wheel', function(event) {
        if (event.ctrlKey) {
            event.preventDefault();
        }
    }, { passive: false });
    
    // キーボードショートカットでのズームを防止
    document.addEventListener('keydown', function(event) {
        if ((event.ctrlKey || event.metaKey) && (event.key === '+' || event.key === '-' || event.key === '=' || event.key === '0')) {
            event.preventDefault();
        }
    });
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
async function onClickButton(event) {
    // クリックのレート制限（0.2秒に1回）
    const now = Date.now();
    if (now - lastClickTime < CLICK_COOLDOWN) {
        return; // クールダウン中は無視
    }
    lastClickTime = now;
    
    if (!player.group) {
        return;
    }
    
    // クリック位置を取得（マウスまたはタッチ）
    let clickX, clickY;
    if (event) {
        if (event.touches && event.touches.length > 0) {
            // タッチイベント
            clickX = event.touches[0].clientX;
            clickY = event.touches[0].clientY;
        } else if (event.clientX !== undefined && event.clientY !== undefined) {
            // マウスイベント
            clickX = event.clientX;
            clickY = event.clientY;
        } else if (event.changedTouches && event.changedTouches.length > 0) {
            // touchendイベント
            clickX = event.changedTouches[0].clientX;
            clickY = event.changedTouches[0].clientY;
        }
    }
    
    // クリック位置が取得できない場合は画面中央を使用
    if (clickX === undefined || clickY === undefined) {
        clickX = window.innerWidth / 2;
        clickY = window.innerHeight / 2;
    }
    
    // クリックエフェクトを表示（一画面内に収める）
    showClickEffect(clickX, clickY);
    
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
        
        // 「+1」が飛ぶアニメーションを表示（少し遅延させて確実に表示）
        setTimeout(() => {
            showFloatingText(clickX, clickY, '+1');
        }, 50);
    } catch (error) {
        console.error(error);
    }
}

// クリックエフェクトを表示する関数（一画面内に収める）
function showClickEffect(x, y) {
    // エフェクト要素を作成
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    
    // ビューポート内に収める（画面外に出ないように調整）
    const maxX = window.innerWidth - 40;
    const maxY = window.innerHeight - 40;
    const minX = 40;
    const minY = 40;
    
    const adjustedX = Math.max(minX, Math.min(maxX, x));
    const adjustedY = Math.max(minY, Math.min(maxY, y));
    
    effect.style.left = `${adjustedX}px`;
    effect.style.top = `${adjustedY}px`;
    
    document.body.appendChild(effect);
    
    // アニメーション後に削除
    setTimeout(() => {
        if (effect.parentNode) {
            effect.remove();
        }
    }, 600);
}

// 「+1」が飛ぶアニメーションを表示する関数
function showFloatingText(x, y, text) {
    // 要素を作成
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-text';
    floatingText.textContent = text;
    
    // ビューポート内に収める（画面外に出ないように調整）
    // transform: translate(-50%, -50%)を使用するため、位置をそのまま設定
    const maxX = window.innerWidth - 50;
    const maxY = window.innerHeight - 50;
    const minX = 50;
    const minY = 50;
    
    const adjustedX = Math.max(minX, Math.min(maxX, x));
    const adjustedY = Math.max(minY, Math.min(maxY, y));
    
    floatingText.style.left = `${adjustedX}px`;
    floatingText.style.top = `${adjustedY}px`;
    
    // DOMに追加
    document.body.appendChild(floatingText);
    
    // 強制的にリフローを発生させてアニメーションを開始
    floatingText.offsetHeight;
    
    // アニメーション後に削除
    setTimeout(() => {
        if (floatingText && floatingText.parentNode) {
            floatingText.remove();
        }
    }, 1000);
}

async function onTradeSubmit(e) {
    e.preventDefault();
    
    if (!player.group) {
        return;
    }
    
    const from = tradeFrom.value;
    const to = tradeTo.value;
    const amount = parseInt(tradeAmount.value);
    
    if (from === to) {
        return;
    }
    
    if (amount <= 0) {
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
        
        // フォームをリセット
        tradeAmount.value = '1';
    } catch (error) {
        console.error(error);
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
// 初期化実行
// ============================================
// DOMContentLoadedを待つ（defer属性があるので通常は不要だが、念のため）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
