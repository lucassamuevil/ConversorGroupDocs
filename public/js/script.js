const resultDiv = document.getElementById('result');
const convertBtn = document.getElementById('Button');
const fileInput = document.getElementById('file-input');
const API_URL = 'https://conversorgroupdocs.onrender.com'; 

function displayStatus(message) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.padding = '10px';
    messageDiv.style.margin = '10px 0';
    messageDiv.style.backgroundColor = '#e3f2fd';
    messageDiv.style.textAlign = 'center';  
    messageDiv.style.borderRadius = '4px';
    resultDiv.innerHTML = '';
    resultDiv.appendChild(messageDiv);
}

function displayError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.textContent = message;
    errorDiv.style.textAlign = 'center';  
    errorDiv.style.padding = '10px';
    errorDiv.style.margin = '10px 0';
    errorDiv.style.backgroundColor = '#ffebee';
    errorDiv.style.color = '#c62828';
    errorDiv.style.borderRadius = '4px';
    resultDiv.innerHTML = '';
    resultDiv.appendChild(errorDiv);
}

async function createDownloadButton(downloadLink, fileName) {
    resultDiv.innerHTML = '';
    
    const container = document.createElement('div');
    container.style.textAlign = 'center';
    
    const successMessage = document.createElement('p');
    successMessage.textContent = 'Arquivo convertido com sucesso!';
    successMessage.style.color = '#2e7d32';
    successMessage.style.marginBottom = '10px';
    container.appendChild(successMessage);
    
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Baixar arquivo convertido';
    downloadButton.style.backgroundColor = '#4CAF50';
    downloadButton.style.color = 'white';
    downloadButton.style.padding = '10px 20px';
    downloadButton.style.border = 'none';
    downloadButton.style.borderRadius = '4px';
    downloadButton.style.cursor = 'pointer';
    
    downloadButton.onclick = async () => {
        try {
            const response = await fetch(`${API_URL}${downloadLink}`);
            if (!response.ok) throw new Error('Erro ao baixar arquivo');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            displayError('Erro ao baixar o arquivo convertido');
            console.error('Erro no download:', error);
        }
    };
    
    container.appendChild(downloadButton);

    const returnBtn = document.getElementById('returnBtn');
    returnBtn.style.display = 'inline-block';

    resultDiv.appendChild(container);
}

async function handleFormSubmit() {
    const file = fileInput.files[0];
    if (!file) {
        displayError('Por favor, selecione um arquivo.');
        return;
    }

    // Disable button and change text
    convertBtn.disabled = true;
    convertBtn.textContent = 'Convertendo...';
    convertBtn.style.backgroundColor = '#cccccc';
    convertBtn.style.cursor = 'not-allowed';

    displayStatus('Convertendo arquivo, por favor aguarde...');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Erro na conversão do arquivo');
        }

        const result = await response.json();

        if (result.success && result.downloadLink) {
            const fileName = `${file.name.split('.')[0]}_convertido.docx`;
            await createDownloadButton(result.downloadLink, fileName);
        } else {
            throw new Error(result.message || 'Erro ao converter arquivo');
        }
    } catch (error) {
        displayError(error.message || 'Erro ao processar o arquivo. Tente novamente.');
        // Reset button state on error
        convertBtn.disabled = false;
        convertBtn.textContent = 'Converter';
        convertBtn.style.backgroundColor = '';
        convertBtn.style.cursor = 'pointer';
    }
}

// Rest of the event listeners remain the same...

convertBtn.addEventListener('click', (event) => {
    event.preventDefault();
    handleFormSubmit();
});

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
        displayStatus(`Arquivo selecionado: ${file.name}`);
    }
});


const fileUploadDrag = document.getElementById('file-upload-drag');

// Função para mudar o estilo quando o arquivo é arrastado para a área
fileUploadDrag.addEventListener('dragover', (event) => {
    event.preventDefault();
    fileUploadDrag.classList.add('drag-over');
});

fileUploadDrag.addEventListener('dragleave', () => {
    fileUploadDrag.classList.remove('drag-over');
});

// Função para capturar o arquivo quando for solto na área de arraste
fileUploadDrag.addEventListener('drop', (event) => {
    event.preventDefault();
    fileUploadDrag.classList.remove('drag-over');
    
    const file = event.dataTransfer.files[0];
    if (file) {
        fileInput.files = event.dataTransfer.files; // Já existe a variável 'fileInput'
        displayStatus(`Arquivo selecionado: ${file.name}`);
    }
});

// Permitir que a área de arraste seja clicada para abrir o explorador de arquivos
fileUploadDrag.addEventListener('click', () => {
    fileInput.click();
});


const chooseFileBtn = document.getElementById('choose-file-btn'); // O botão "Escolher arquivo"

// Permitir que o botão "Escolher arquivo" abra o seletor de arquivos
chooseFileBtn.addEventListener('click', () => {
    fileInput.click(); // Aciona a ação do input de arquivos
});

// O restante do código de manipulação de arquivos permanece igual
fileUploadDrag.addEventListener('dragover', (event) => {
    event.preventDefault();
    fileUploadDrag.classList.add('drag-over');
});

fileUploadDrag.addEventListener('dragleave', () => {
    fileUploadDrag.classList.remove('drag-over');
});

fileUploadDrag.addEventListener('drop', (event) => {
    event.preventDefault();
    fileUploadDrag.classList.remove('drag-over');
    
    const file = event.dataTransfer.files[0];
    if (file) {
        fileInput.files = event.dataTransfer.files;
        displayStatus(`Arquivo selecionado: ${file.name}`);
    }
});

fileUploadDrag.addEventListener('click', () => {
    fileInput.click();
});
