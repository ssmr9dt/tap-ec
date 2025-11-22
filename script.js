let score = 0;
const gameArea = document.getElementById('gameArea');
const scoreDisplay = document.getElementById('score');
const instruction = document.querySelector('.instruction');

// スコアを更新する関数
function updateScore() {
    score++;
    scoreDisplay.textContent = score;
    
    // スコアが増えたら指示を非表示
    if (score === 1) {
        instruction.style.opacity = '0';
        setTimeout(() => {
            instruction.style.display = 'none';
        }, 300);
    }
}

// タップ/クリック位置に「+1」を表示する関数
function createPointText(x, y) {
    const pointText = document.createElement('div');
    pointText.className = 'point-text';
    pointText.textContent = '+1';
    
    // ランダムなオフセットを追加して散らばり感を出す
    const randomOffsetX = (Math.random() - 0.5) * 50;
    const randomOffsetY = (Math.random() - 0.5) * 30;
    
    pointText.style.left = `${x + randomOffsetX}px`;
    pointText.style.top = `${y + randomOffsetY}px`;
    
    gameArea.appendChild(pointText);
    
    // アニメーション終了後に要素を削除
    setTimeout(() => {
        pointText.remove();
    }, 1000);
}

// リップルエフェクトを作成する関数
function createRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = '20px';
    ripple.style.height = '20px';
    
    gameArea.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// クリック/タップイベントハンドラー
function handleClick(event) {
    const x = event.clientX || event.touches[0].clientX;
    const y = event.clientY || event.touches[0].clientY;
    
    updateScore();
    createPointText(x, y);
    createRipple(x, y);
}

// イベントリスナーの設定
gameArea.addEventListener('click', handleClick);
gameArea.addEventListener('touchstart', handleClick, { passive: true });

// スコア表示のアニメーション
function animateScore() {
    scoreDisplay.style.transform = 'scale(1.2)';
    setTimeout(() => {
        scoreDisplay.style.transform = 'scale(1)';
    }, 200);
}

// スコア更新時にアニメーションを追加
const originalUpdateScore = updateScore;
updateScore = function() {
    originalUpdateScore();
    animateScore();
};
