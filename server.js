require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const GroupDocsConversion = require('groupdocs-conversion-cloud');
const cors = require('cors');

const app = express();

// Configurações do CORS
app.use(cors());

// Configurações do Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
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

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/upload', upload.single('file'), async (req, res) => {
    console.log('Recebido upload de arquivo:', req.file);

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
        console.log('Iniciando upload para GroupDocs...');
        // Upload do arquivo para o GroupDocs
        const fileApi = new GroupDocsConversion.FileApi(configuration);
        const fileStream = fs.readFileSync(inputPath);
        await fileApi.uploadFile(new GroupDocsConversion.UploadFileRequest(req.file.originalname, fileStream));
        console.log('Upload concluído.');

        // Configuração da conversão
        const settings = {
            filePath: req.file.originalname,
            format: 'docx',
            outputPath: outputFileName
        };

        console.log('Iniciando conversão de documento...');
        // Converter o documento
        await conversionApi.convertDocument(new GroupDocsConversion.ConvertDocumentRequest(settings));
        console.log('Conversão concluída.');

        // Download do arquivo convertido
        console.log('Iniciando download do arquivo convertido...');
        const downloadedFile = await fileApi.downloadFile(
            new GroupDocsConversion.DownloadFileRequest(settings.outputPath)
        );

        // Salvar o arquivo convertido
        fs.writeFileSync(outputPath, downloadedFile);
        console.log('Arquivo convertido salvo com sucesso.');

        // Remover arquivo original após a conversão
        fs.unlinkSync(inputPath);

        // Enviar resposta com o link para download
        res.json({
            success: true,
            message: 'Arquivo convertido com sucesso!',
            downloadLink: `/uploads/${outputFileName}`
        });

    } catch (error) {
        console.error('Erro durante a conversão:', error);

        // Limpar arquivos em caso de erro
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
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
