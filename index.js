const { program } = require('commander');
const express = require('express');
const path = require('path');
const multer = require('multer');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Маршрут для отримання нотатки за ім'ям
app.get('/notes/:name', (req, res) => {
    const noteName = req.params.name;
    const note = notes.find(note => note.name === noteName);
    if (!note) {
        return res.status(404).send('Not found');
    }
    return res.send(note.text);
});

// Маршрут для оновлення тексту нотатки
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

// Маршрут для видалення нотатки
app.delete('/notes/:name', (req, res) => {
    const noteName = req.params.name;
    const noteIndex = notes.findIndex(note => note.name === noteName);
    if (noteIndex === -1) {
        return res.status(404).send('Not found');
    }
    notes.splice(noteIndex, 1);
    return res.status(204).send();
});

// Маршрут для отримання списку нотаток
app.get('/notes', (req, res) => {
    return res.status(200).json(notes);
});

// Маршрут для створення нової нотатки
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