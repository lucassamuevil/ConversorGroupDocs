require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const GroupDocsConversion = require('groupdocs-conversion-cloud');
const cors = require('cors');

const app = express();

// Configurações do CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    exposedHeaders: ['Content-Disposition']
}));

// Criar pasta uploads se não existir
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurações do Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Configurações do GroupDocs
const apiKey = process.env.GROUPDOCS_API_KEY;
const apiSid = process.env.GROUPDOCS_API_SID;

if (!apiKey || !apiSid) {
    console.error('Variáveis de ambiente GROUPDOCS_API_KEY e GROUPDOCS_API_SID são necessárias');
    process.exit(1);
}

const configuration = new GroupDocsConversion.Configuration(apiKey, apiSid);
const conversionApi = new GroupDocsConversion.ConvertApi(configuration);

// Rota para download de arquivos
app.get('/uploads/:filename', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'uploads', req.params.filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Arquivo não encontrado'
            });
        }

        res.setHeader('Content-Disposition', `attachment; filename=${req.params.filename}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Erro ao enviar arquivo:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao baixar arquivo'
        });
    }
});

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Nenhum arquivo foi enviado.'
        });
    }

    const inputPath = req.file.path;
    const outputFileName = `${path.parse(req.file.originalname).name}_${Date.now()}.docx`;
    const outputPath = path.join('uploads', outputFileName);

    try {
        const fileApi = new GroupDocsConversion.FileApi(configuration);
        const fileStream = fs.readFileSync(inputPath);
        await fileApi.uploadFile(new GroupDocsConversion.UploadFileRequest(req.file.originalname, fileStream));

        const settings = {
            filePath: req.file.originalname,
            format: 'docx',
            outputPath: outputFileName
        };

        await conversionApi.convertDocument(new GroupDocsConversion.ConvertDocumentRequest(settings));

        const downloadedFile = await fileApi.downloadFile(
            new GroupDocsConversion.DownloadFileRequest(settings.outputPath)
        );

        fs.writeFileSync(outputPath, downloadedFile);
        fs.unlinkSync(inputPath);

        res.json({
            success: true,
            message: 'Arquivo convertido com sucesso!',
            downloadLink: `/uploads/${outputFileName}`
        });

    } catch (error) {
        console.error('Erro durante a conversão:', error);

        if (fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
        }
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }

        res.status(500).json({
            success: false,
            message: 'Erro ao converter o arquivo: ' + error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});