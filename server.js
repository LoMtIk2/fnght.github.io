const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mineflayer = require('mineflayer');
const path = require('path');

let bot = null;

// Настройка CORS
io.origins(['*']);

// Отправка index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Обработка WebSocket
io.on('connection', (socket) => {
    socket.on('startBot', (data) => {
        if (bot) return;

        bot = mineflayer.createBot({
            host: data.host,
            port: data.port,
            username: data.username,
            version: '1.21.5',
            auth: 'offline'
        });

        bot.on('login', () => socket.emit('log', '✓ Подключение установлено'));
        bot.on('spawn', () => socket.emit('log', '✓ Спавн в мире'));
        bot.on('kicked', reason => socket.emit('log', `𐄂 Кик: ${reason}`));
        bot.on('error', err => socket.emit('log', `𐄂 Ошибка: ${err.message}`));
    });

    socket.on('stopBot', () => {
        if (bot) {
            bot.end();
            bot = null;
            socket.emit('log', '⏹ Бот остановлен');
        }
    });
});

// Запуск сервера
http.listen(3000, () => {
    console.log('Сервер работает: http://localhost:3000');
});
