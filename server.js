const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const mineflayer = require('mineflayer');
const path = require('path');

let bot = null;

// Middleware
app.use(express.static(__dirname)); // Обслуживание статических файлов
app.use(express.json()); // Парсинг JSON-тела запросов

// Логирование запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Обработка корневого пути
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// WebSocket обработчики
io.on('connection', (socket) => {
  console.log(`Новое подключение: ${socket.id}`);

  socket.on('startBot', (data) => {
    try {
      // Валидация входных данных
      if (!data.host || !data.port || !data.username) {
        return socket.emit('log', '𐄂 Ошибка: Заполните все поля');
      }

      if (bot) {
        return socket.emit('log', '𐄂 Бот уже запущен');
      }

      // Создание бота
      bot = mineflayer.createBot({
        host: data.host,
        port: parseInt(data.port),
        username: data.username,
        version: '1.20.1', // Исправленная версия
        auth: 'offline'
      });

      // Обработчики событий бота
      const handlers = {
        login: () => socket.emit('log', '✓ Подключение установлено'),
        spawn: () => socket.emit('log', '✓ Спавн в мире'),
        kicked: (reason) => socket.emit('log', `𐄂 Кик: ${reason}`),
        error: (err) => socket.emit('log', `𐄂 Ошибка: ${err.message}`)
      };

      // Регистрация обработчиков
      Object.entries(handlers).forEach(([event, handler]) => {
        bot.on(event, handler);
      });

      socket.on('disconnect', () => {
        if (bot) {
          bot.end();
          bot = null;
          console.log('Бот остановлен из-за отключения клиента');
        }
      });

    } catch (error) {
      console.error('Ошибка при создании бота:', error);
      socket.emit('log', `𐄂 Фатальная ошибка: ${error.message}`);
    }
  });

  socket.on('stopBot', () => {
    if (bot) {
      // Удаление всех обработчиков событий
      bot.removeAllListeners();
      bot.end();
      bot = null;
      socket.emit('log', '⏹ Бот остановлен');
      console.log('Бот остановлен по запросу пользователя');
    }
  });

  socket.on('disconnect', () => {
    console.log(`Клиент отключен: ${socket.id}`);
  });
});

// Обработка ошибок сервера
http.on('error', (error) => {
  console.error('Ошибка сервера:', error);
});

// Запуск сервера
http.listen(3000, () => {
  console.log('Сервер работает: http://localhost:3000');
  console.log('Текущая директория:', __dirname);
});
