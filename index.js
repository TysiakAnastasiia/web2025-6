const { program } = require('commander');
const express = require('express');
const path = require('path');
const multer = require('multer');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger налаштування
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Notes Service API',
            version: '1.0.0',
            description: 'API для управління нотатками',
        },
    },
    apis: ['./index.js'], // Вказуємо на сам файл
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const upload = multer();

program
    .requiredOption('-h, --host <host>', 'server address')
    .requiredOption('-p, --port <port>', 'server port')
    .requiredOption('-c, --cache <cache>', 'path to the cache');
program.parse(process.argv);

const { host, port, cache } = program.opts();

if (!host || !port || !cache) {
    console.error('All options -h, -p, -c are necessary!');
    process.exit(1);
}

// Масив для зберігання нотаток
let notes = [];
app.get('/', (req, res) => {
    res.redirect('/UploadForm.html');
});

/**
 * @swagger
 * /notes/{name}:
 *   get:
 *     summary: Отримати текст нотатки за ім'ям
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Ім'я нотатки
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Текст нотатки
 *       404:
 *         description: Нотатка не знайдена
 */
app.get('/notes/:name', (req, res) => {
    const noteName = req.params.name;
    const note = notes.find(note => note.name === noteName);
    if (!note) {
        return res.status(404).send('Not found');
    }
    return res.send(note.text);
});

/**
 * @swagger
 * /notes/{name}:
 *   put:
 *     summary: Оновити текст нотатки
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Ім'я нотатки
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *     responses:
 *       200:
 *         description: Оновлений текст нотатки
 *       404:
 *         description: Нотатка не знайдена
 */
app.put('/notes/:name', express.text(), (req, res) => {
    const noteName = req.params.name;
    const newText = req.body;

    const note = notes.find(n => n.name === noteName);
    if (!note) {
        return res.status(404).send('Not found');
    }

    note.text = newText;
    return res.send(note);
});

/**
 * @swagger
 * /notes/{name}:
 *   delete:
 *     summary: Видалити нотатку за ім'ям
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Ім'я нотатки
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Нотатка успішно видалена
 *       404:
 *         description: Нотатка не знайдена
 */
app.delete('/notes/:name', (req, res) => {
    const noteName = req.params.name;
    const noteIndex = notes.findIndex(note => note.name === noteName);
    if (noteIndex === -1) {
        return res.status(404).send('Not found');
    }
    notes.splice(noteIndex, 1);
    return res.status(204).send();
});

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Отримати список всіх нотаток
 *     responses:
 *       200:
 *         description: Список нотаток
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   text:
 *                     type: string
 */
app.get('/notes', (req, res) => {
    return res.status(200).json(notes);
});

/**
 * @swagger
 * /write:
 *   post:
 *     summary: Створити нову нотатку
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               note_name:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Нотатку успішно створено
 *       400:
 *         description: Неправильні дані
 */
app.post('/write', upload.none(), (req, res) => {
    const { note_name, note } = req.body;

    if (!note_name || !note) {
        return res.status(400).send('Note name and text are required');
    }

    const existingNote = notes.find(n => n.name === note_name);
    if (existingNote) {
        return res.status(400).send('Bad Request');
    }

    notes.push({ name: note_name, text: note });
    return res.status(201).send('Created');
});

app.use(express.static(path.join(__dirname, 'front')));

// Маршрут для відображення HTML-форми
app.get('/UploadForm.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'front', 'UploadForm.html'));
});

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
