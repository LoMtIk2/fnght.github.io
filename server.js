const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mineflayer = require('mineflayer');

let bot = null;

// Старт бота
io.on('connection', (socket) => {
  socket.on('startBot', (data) => {
    if (bot) return;

    bot = mineflayer.createBot({
      host: data.host,
      port: data.port,
      username: data.username,
      version: '1.20.1'
    });

    // Перехват логов
    const sendLog = (msg) => socket.emit('log', msg);
    
    bot.on('login', () => sendLog('Бот подключился!'));
    bot.on('spawn', () => sendLog('Бот появился в мире'));
    bot.on('kicked', (reason) => sendLog(`Кик: ${reason}`));
    bot.on('error', (err) => sendLog(`Ошибка: ${err}`));
  });

  // Остановка бота
  socket.on('stopBot', () => {
    if (bot) {
      bot.end();
      bot = null;
    }
  });
});

app.use(express.static('public')); // Папка с фронтендом
http.listen(3000, () => console.log('Сервер запущен на порту 3000'));
