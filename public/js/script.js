const resultDiv = document.getElementById('result');
const convertBtn = document.getElementById('convertBtn');
const fileInput = document.getElementById('file-input');
const API_URL = 'https://conversorgroupdocs.onrender.com'; 

function displayStatus(message) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.padding = '10px';
    messageDiv.style.margin = '10px 0';
    messageDiv.style.backgroundColor = '#e3f2fd';
    messageDiv.style.borderRadius = '4px';
    resultDiv.innerHTML = '';
    resultDiv.appendChild(messageDiv);
}

function displayError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.textContent = message;
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
    resultDiv.appendChild(container);
}

async function handleFormSubmit() {
    const file = fileInput.files[0];
    if (!file) {
        displayError('Por favor, selecione um arquivo.');
        return;
    }

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
    }
}

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