const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 静的ファイルの提供
app.use(express.static(__dirname));

// ゲーム状態の管理
let gameState = {
    groups: {
        A: { totalWealth: 0 },
        B: { totalWealth: 0 },
        C: { totalWealth: 0 },
        D: { totalWealth: 0 }
    },
    rates: {
        A: 1,
        B: 1,
        C: 1,
        D: 1
    },
    players: {} // プレイヤーID -> プレイヤー情報
};

// Socket.IO接続処理
io.on('connection', (socket) => {
    console.log(`プレイヤーが接続しました: ${socket.id}`);

    // プレイヤー情報を初期化
    gameState.players[socket.id] = {
        id: socket.id,
        group: null,
        commonCurrency: 0,
        groupCurrencies: {
            A: 0,
            B: 0,
            C: 0,
            D: 0
        }
    };

    // 初期状態を送信
    socket.emit('initialState', {
        groups: gameState.groups,
        rates: gameState.rates,
        player: gameState.players[socket.id]
    });

    // グループ選択
    socket.on('selectGroup', (data) => {
        const { group } = data;
        if (gameState.players[socket.id]) {
            gameState.players[socket.id].group = group;
            socket.emit('groupSelected', { group });
        }
    });

    // クリック処理
    socket.on('click', async (data) => {
        const player = gameState.players[socket.id];
        if (!player || !player.group) {
            socket.emit('error', { message: 'グループが選択されていません' });
            return;
        }

        // プレイヤーの所属グループの資産を+1
        gameState.groups[player.group].totalWealth += 1;

        // プレイヤーの個人資産も+1（共通通貨と選択中のグループ通貨）
        player.commonCurrency += 1;
        player.groupCurrencies[player.group] += 1;

        // 更新された状態を全クライアントに送信
        io.emit('stateUpdate', {
            groups: gameState.groups,
            rates: gameState.rates,
            playerId: socket.id,
            player: player
        });

        // クリックしたプレイヤーに結果を送信
        socket.emit('clickResult', {
            player: player,
            groups: gameState.groups
        });
    });

    // 切断処理
    socket.on('disconnect', () => {
        console.log(`プレイヤーが切断しました: ${socket.id}`);
        delete gameState.players[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});
