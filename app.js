const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const publicFolder = './uploads/public';
const privateFolder = './uploads/private';

if (!fs.existsSync(publicFolder)) fs.mkdirSync(publicFolder, { recursive: true });
if (!fs.existsSync(privateFolder)) fs.mkdirSync(privateFolder, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = req.body.uploadType === 'private' ? privateFolder : publicFolder;
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/files', (req, res) => {
    fs.readdir(publicFolder, (err, files) => {
        if (err) return res.status(500).send('無法讀取檔案列表');
        res.json(files);
    });
});

app.get('/download/:filename', (req, res) => {
    const file = path.join(publicFolder, req.params.filename);
    res.download(file, err => {
        if (err) res.status(500).send('下載失敗');
    });
});

app.post('/upload', upload.single('file'), (req, res) => {
    res.status(200).send('檔案上傳成功');
});

app.post('/delete', (req, res) => {
    const { filename, password } = req.body;

    if (password !== 'del5678') {
        return res.status(403).send('密碼錯誤');
    }

    const filePath = path.join(publicFolder, filename);
    fs.unlink(filePath, (err) => {
        if (err) return res.status(500).send('檔案不存在或刪除失敗');
        res.status(200).send('檔案已刪除');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`伺服器已啟動，正在監聽 http://localhost:${PORT}`);
});
