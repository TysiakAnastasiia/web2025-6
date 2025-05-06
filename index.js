const express = require('express');
const { Command } = require('commander');
const http = require('http');
const path = require('path');
const fs = require('fs');

const program = new Command();

program
  .requiredOption('-h, --host <host>', 'Host address (наприклад, 127.0.0.1)')
  .requiredOption('-p, --port <port>', 'Port number (від 1 до 65535)')
  .requiredOption('-c, --cache <cache>', 'Path to cache directory')
  .parse(process.argv);

const { host, port, cache } = program.opts();

// Перевірка наявності всіх параметрів
if (!host || !port || !cache) {
  console.error(' Помилка: потрібно вказати всі параметри: --host, --port, --cache');
  process.exit(1);
}

// Перевірка, чи порт є числом у допустимому діапазоні
const portNumber = parseInt(port, 10);
if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
  console.error(' Помилка: параметр --port має бути числом від 1 до 65535');
  process.exit(1);
}

// Перевірка, чи існує директорія кешу
if (!fs.existsSync(cache) || !fs.lstatSync(cache).isDirectory()) {
  console.error(` Помилка: директорія кешу "${cache}" не існує або це не директорія`);
  process.exit(1);
}

const app = express();

// Статичні файли з кешу
app.use(express.static(path.resolve(cache)));

app.get('/', (req, res) => {
  res.send('Сервер працює! Статичні файли завантажуються з директорії кешу.');
});

const server = http.createServer(app);

server.listen(portNumber, host, () => {
  console.log(`Сервер запущено на http://${host}:${portNumber}`);
  console.log(`Кеш-директорія: ${path.resolve(cache)}`);
});
