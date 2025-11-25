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
// グループ名マッピング
// ============================================
const groupNames = {
    A: 'ルビー',
    B: 'サファイア',
    C: 'エメラルド',
    D: 'トパーズ'
};

const groupColors = {
    A: '#e91e63', // ルビー（赤）
    B: '#2196f3', // サファイア（青）
    C: '#4caf50', // エメラルド（緑）
    D: '#ffc107'  // トパーズ（黄）
};

// ============================================
// localStorage管理関数
// ============================================
const STORAGE_KEY = 'clicker-game-state';

function saveGameState() {
    try {
        const gameState = {
            player: player,
            groups: groups,
            rates: rates,
            clickCount: clickCount,
            timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (error) {
        console.error('Failed to save game state:', error);
    }
}

function loadGameState() {
    try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            const gameState = JSON.parse(savedState);
            
            // データの整合性チェック
            if (gameState.player && gameState.groups && gameState.rates) {
                player = {
                    group: gameState.player.group || null,
                    commonCurrency: gameState.player.commonCurrency || 0,
                    groupCurrencies: gameState.player.groupCurrencies || {
                        A: 0,
                        B: 0,
                        C: 0,
                        D: 0
                    }
                };
                
                groups = gameState.groups || {
                    A: { totalWealth: 0 },
                    B: { totalWealth: 0 },
                    C: { totalWealth: 0 },
                    D: { totalWealth: 0 }
                };
                
                rates = gameState.rates || {
                    A: 1,
                    B: 1,
                    C: 1,
                    D: 1
                };
                
                clickCount = gameState.clickCount || 0;
                
                return true;
            }
        }
    } catch (error) {
        console.error('Failed to load game state:', error);
    }
    return false;
}

function clearGameState() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear game state:', error);
    }
}

// ============================================
// DOM要素の取得
// ============================================
const gameContainer = document.getElementById('game-container');
const mainContent = document.querySelector('.main-content');
const header = document.querySelector('.header');
const clickButton = document.getElementById('click-button');
const playerGroupDisplay = document.getElementById('player-group');
const groupIconButtons = document.querySelectorAll('.group-icon-btn');
const groupValueA = document.getElementById('group-value-A');
const groupValueB = document.getElementById('group-value-B');
const groupValueC = document.getElementById('group-value-C');
const groupValueD = document.getElementById('group-value-D');

// ============================================
// PixiJS初期化
// ============================================
let pixiApp = null;
let pixiContainer = null;

function initPixiJS() {
    const container = document.getElementById('pixi-container');
    if (!container) {
        console.warn('PixiJS container not found');
        return;
    }

    try {
        // PixiJSアプリケーションを作成
        pixiApp = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundAlpha: 0, // 透明な背景（既存のCSS背景を表示）
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });

        // コンテナに追加（v7ではcanvasプロパティを使用）
        const canvas = pixiApp.canvas || pixiApp.view;
        if (canvas) {
            container.appendChild(canvas);
        }

        // リサイズ対応
        window.addEventListener('resize', () => {
            if (pixiApp) {
                const renderer = pixiApp.renderer || pixiApp.screen;
                if (renderer && renderer.resize) {
                    renderer.resize(window.innerWidth, window.innerHeight);
                } else {
                    pixiApp.renderer.resize(window.innerWidth, window.innerHeight);
                }
            }
        });

        // コンテナを作成
        pixiContainer = new PIXI.Container();
        pixiApp.stage.addChild(pixiContainer);

        console.log('PixiJS initialized successfully');
    } catch (error) {
        console.error('Failed to initialize PixiJS:', error);
    }
}

// ============================================
// 初期化関数
// ============================================
function init() {
    // PixiJSを初期化
    if (typeof PIXI !== 'undefined') {
        initPixiJS();
    } else {
        console.warn('PixiJS is not loaded. Waiting for script to load...');
        // PixiJSが読み込まれるまで待つ
        const checkPixi = setInterval(() => {
            if (typeof PIXI !== 'undefined') {
                clearInterval(checkPixi);
                initPixiJS();
            }
        }, 100);
    }
    // クリックボタン下のグループアイコンボタンのイベントリスナー
    groupIconButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const selectedGroup = e.target.closest('.group-icon-btn')?.dataset.group;
            if (selectedGroup) {
                selectGroup(selectedGroup);
            }
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

    // ゲームコンテナ全体のクリックイベントリスナー（一画面全体）
    gameContainer.addEventListener('click', (e) => {
        // フォーム、ボタン、テーブル、リンク、モーダルなどのインタラクティブ要素をクリックした場合は無視
        if (e.target.closest('form') || 
            e.target.closest('button') || 
            e.target.closest('input') || 
            e.target.closest('select') ||
            e.target.closest('table') ||
            e.target.closest('a') ||
            e.target.closest('.modal') ||
            e.target.closest('#trade-modal') ||
            e.target.closest('#group-wealth-modal') ||
            e.target.closest('#exchange-rate-modal')) {
            return;
        }
        // クリック位置を確実に取得
        const clickEvent = {
            clientX: e.clientX,
            clientY: e.clientY,
            pageX: e.pageX,
            pageY: e.pageY
        };
        onClickButton(clickEvent);
    });
    
    // ゲームコンテナ全体のタッチイベント（モバイル対応）
    gameContainer.addEventListener('touchend', (e) => {
        if (e.target.closest('form') || 
            e.target.closest('button') || 
            e.target.closest('input') || 
            e.target.closest('select') ||
            e.target.closest('table') ||
            e.target.closest('a') ||
            e.target.closest('.modal')) {
            return;
        }
        e.preventDefault(); // デフォルトの動作を防ぐ
        // タッチ位置を確実に取得
        const touchEvent = {
            changedTouches: e.changedTouches,
            clientX: e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : undefined,
            clientY: e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : undefined
        };
        onClickButton(touchEvent);
    }, { passive: false });


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
    
    // プレイヤーグループの色を設定
    if (playerGroupDisplay) {
        playerGroupDisplay.style.backgroundColor = groupColors[group];
        playerGroupDisplay.textContent = groupNames[group];
    }
    
    // クリックボタン下のグループアイコンボタンのスタイルを更新
    groupIconButtons.forEach(btn => {
        const btnGroup = btn.dataset.group;
        if (btnGroup === group) {
            btn.style.opacity = '1';
            btn.style.transform = 'scale(1.2)';
            btn.style.filter = `drop-shadow(0 0 15px ${groupColors[group]})`;
        } else {
            btn.style.opacity = '0.5';
            btn.style.transform = 'scale(1)';
            btn.style.filter = 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.5))';
        }
    });
    
    renderAll();
    renderGroupValues();
    
    // 状態を保存
    saveGameState();
}

// 初期状態の読み込み（localStorageから復元）
function loadInitialState() {
    const loaded = loadGameState();
    if (loaded && player.group) {
        // プレイヤーグループの色を設定
        if (playerGroupDisplay) {
            playerGroupDisplay.style.backgroundColor = groupColors[player.group];
            playerGroupDisplay.textContent = groupNames[player.group];
        }
    
        // クリックボタン下のグループアイコンボタンのスタイルを更新
        groupIconButtons.forEach(btn => {
            const btnGroup = btn.dataset.group;
            if (btnGroup === player.group) {
                btn.style.opacity = '1';
                btn.style.transform = 'scale(1.2)';
                btn.style.filter = `drop-shadow(0 0 15px ${groupColors[player.group]})`;
            } else {
                btn.style.opacity = '0.5';
                btn.style.transform = 'scale(1)';
                btn.style.filter = 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.5))';
            }
        });
        
        // UIを更新
        renderAll();
        renderGroupValues();
    } else {
        // 保存された状態がない場合は初期状態
        // 初期値は既に設定済み（全て0、レートは1）
        // 初期表示のためグループ値を表示
        renderGroupValues();
    }
}

// ============================================
// UI更新関数
// ============================================
function renderAll() {
    renderPlayerInfo();
    renderGroupValues();
}

function renderPlayerInfo() {
    if (player.group && playerGroupDisplay) {
        playerGroupDisplay.textContent = groupNames[player.group];
    }
}

function renderGroupValues() {
    // 各グループの個人資産を表示
    if (groupValueA && player.groupCurrencies) {
        groupValueA.textContent = (player.groupCurrencies.A || 0).toLocaleString();
    }
    if (groupValueB && player.groupCurrencies) {
        groupValueB.textContent = (player.groupCurrencies.B || 0).toLocaleString();
    }
    if (groupValueC && player.groupCurrencies) {
        groupValueC.textContent = (player.groupCurrencies.C || 0).toLocaleString();
    }
    if (groupValueD && player.groupCurrencies) {
        groupValueD.textContent = (player.groupCurrencies.D || 0).toLocaleString();
    }
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
        // touchendイベントの場合（タッチ終了）
        if (event.changedTouches && event.changedTouches.length > 0) {
            clickX = event.changedTouches[0].clientX;
            clickY = event.changedTouches[0].clientY;
        }
        // touchstart/touchmoveイベントの場合（タッチ中）
        else if (event.touches && event.touches.length > 0) {
            clickX = event.touches[0].clientX;
            clickY = event.touches[0].clientY;
        }
        // マウスイベントの場合
        else if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
            clickX = event.clientX;
            clickY = event.clientY;
        }
        // pageX/pageYをフォールバックとして使用
        else if (typeof event.pageX === 'number' && typeof event.pageY === 'number') {
            clickX = event.pageX;
            clickY = event.pageY;
        }
    }
    
    // クリック位置が取得できない場合は画面中央を使用
    if (clickX === undefined || clickY === undefined || isNaN(clickX) || isNaN(clickY)) {
        clickX = window.innerWidth / 2;
        clickY = window.innerHeight / 2;
    }
    
    // クリックエフェクトを表示（一画面内に収める）
    showClickEffect(clickX, clickY);
    
    // ツルハシのアニメーションをトリガー
    const clickButton = document.getElementById('click-button');
    if (clickButton) {
        clickButton.classList.add('clicking');
        setTimeout(() => {
            clickButton.classList.remove('clicking');
        }, 300);
    }
    
    try {
        // モックAPIを呼び出し
        const result = await mockClick(player, groups);
        
        // 状態を更新
        player = result.player;
        groups = result.groups;
        clickCount++;
        
        // UIを更新（グループ値を明示的に更新）
        renderAll();
        renderGroupValues();
        
        // 状態を保存
        saveGameState();
        
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
    // 既存のDOMエフェクト（後方互換性のため保持）
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

    // PixiJSでパーティクルエフェクトを追加
    if (pixiApp && pixiContainer && player.group) {
        showPixiClickEffect(adjustedX, adjustedY);
    }
}

// PixiJSを使ったクリックエフェクト
function showPixiClickEffect(x, y) {
    if (!pixiApp || !pixiContainer) return;

    const groupColor = groupColors[player.group];
    // カラーコードを16進数に変換（例: #e91e63 -> 0xe91e63）
    const color = parseInt(groupColor.replace('#', ''), 16);
    
    // パーティクルを作成
    const particleCount = 20;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
        const particle = new PIXI.Graphics();
        
        // ランダムなサイズと色
        const size = Math.random() * 8 + 4;
        const alpha = Math.random() * 0.5 + 0.5;
        const particleColor = color;
        
        // 円形のパーティクルを描画
        particle.beginFill(particleColor, alpha);
        particle.drawCircle(0, 0, size);
        particle.endFill();
        
        // 位置を設定
        particle.x = x;
        particle.y = y;
        
        // ランダムな速度と方向
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const speed = Math.random() * 5 + 3;
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;
        particle.life = 1.0;
        particle.decay = Math.random() * 0.02 + 0.02;
        
        pixiContainer.addChild(particle);
        particles.push(particle);
    }

    // アニメーションループ
    const animate = () => {
        let allDead = true;
        
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            
            if (particle.life > 0) {
                allDead = false;
                
                // 位置を更新
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // 速度を減衰
                particle.vx *= 0.95;
                particle.vy *= 0.95;
                
                // ライフを減らす
                particle.life -= particle.decay;
                particle.alpha = particle.life;
                
                // サイズを縮小
                particle.scale.x = particle.life;
                particle.scale.y = particle.life;
            } else {
                // パーティクルを削除
                pixiContainer.removeChild(particle);
                particle.destroy();
                particles.splice(i, 1);
            }
        }
        
        if (!allDead) {
            requestAnimationFrame(animate);
        }
    };
    
    animate();
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
            
            // プレイヤーの個人資産も+1（共通通貨と選択中のグループ通貨）
            const updatedPlayer = {
                ...player,
                commonCurrency: player.commonCurrency + 1,
                groupCurrencies: {
                    ...player.groupCurrencies,
                    [player.group]: player.groupCurrencies[player.group] + 1
                }
            };
            
            resolve({
                player: updatedPlayer,
                groups: updatedGroups
            });
        }, 100); // 100msの遅延でサーバー通信をシミュレート
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

