// ゲームの基本設定
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const scoreElement = document.getElementById('score');

// キャンバスのサイズ設定
canvas.width = 600;
canvas.height = 400;

// ゲームの状態
let gameState = {
    running: false,
    score: 0,
    frame: 0
};

// ゲームオブジェクトの例（ここをカスタマイズしてゲームを作成）
let gameObjects = [];

// ゲームの初期化
function init() {
    gameState.running = false;
    gameState.score = 0;
    gameState.frame = 0;
    gameObjects = [];
    updateScore();
    draw();
}

// スコアの更新
function updateScore() {
    scoreElement.textContent = gameState.score;
}

// ゲームループ
function gameLoop() {
    if (!gameState.running) return;
    
    // 画面をクリア
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // ゲームオブジェクトの更新と描画
    update();
    draw();
    
    gameState.frame++;
    requestAnimationFrame(gameLoop);
}

// ゲームの更新処理
function update() {
    // ここにゲームロジックを追加
    // 例: オブジェクトの移動、衝突判定など
}

// ゲームの描画処理
function draw() {
    // ここに描画処理を追加
    // 例: プレイヤー、敵、背景などの描画
    
    // デモ: 簡単なアニメーション
    if (gameState.running) {
        const x = (gameState.frame * 2) % canvas.width;
        ctx.fillStyle = '#667eea';
        ctx.beginPath();
        ctx.arc(x, canvas.height / 2, 20, 0, Math.PI * 2);
        ctx.fill();
    }
}

// イベントリスナー
startBtn.addEventListener('click', () => {
    if (!gameState.running) {
        gameState.running = true;
        startBtn.disabled = true;
        startBtn.textContent = 'ゲーム実行中...';
        gameLoop();
    }
});

resetBtn.addEventListener('click', () => {
    gameState.running = false;
    startBtn.disabled = false;
    startBtn.textContent = 'ゲーム開始';
    init();
});

// キーボード入力の処理（例）
document.addEventListener('keydown', (e) => {
    if (!gameState.running) return;
    
    // ここにキーボード入力の処理を追加
    // 例: スペースキーでジャンプ、矢印キーで移動など
    console.log('キーが押されました:', e.key);
});

// 初期化
init();
