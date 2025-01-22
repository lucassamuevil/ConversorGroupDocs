const resultDiv = document.getElementById('result');
const convertBtn = document.getElementById('convertBtn');
const fileInput = document.getElementById('file-input');
const API_URL = 'https://conversorgroupdocs.onrender.com/upload';


// Função para exibir mensagens de status
function displayStatus(message) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.padding = '10px';
    messageDiv.style.margin = '10px 0';
    messageDiv.style.backgroundColor = '#e3f2fd';
    messageDiv.style.borderRadius = '4px';
    resultDiv.innerHTML = ''; // Limpar conteúdo anterior
    resultDiv.appendChild(messageDiv);
    console.log('displayStatus:', message);
}

// Função para exibir mensagens de erro
function displayError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.textContent = message;
    errorDiv.style.padding = '10px';
    errorDiv.style.margin = '10px 0';
    errorDiv.style.backgroundColor = '#ffebee';
    errorDiv.style.color = '#c62828';
    errorDiv.style.borderRadius = '4px';
    resultDiv.innerHTML = ''; // Limpar conteúdo anterior
    resultDiv.appendChild(errorDiv);
    console.log('displayError:', message);
}

// Função para criar o botão de download
function createDownloadButton(downloadLink, fileName) {
    console.log('Criando botão de download:', { downloadLink, fileName });

    // Limpa o conteúdo anterior
    resultDiv.innerHTML = '';

    // Cria o container
    const container = document.createElement('div');
    container.style.textAlign = 'center';

    // Mensagem de sucesso
    const successMessage = document.createElement('p');
    successMessage.textContent = 'Arquivo convertido com sucesso!';
    successMessage.style.color = '#2e7d32';
    successMessage.style.marginBottom = '10px';
    container.appendChild(successMessage);

    // Cria o botão de download
    const downloadButton = document.createElement('a');
    downloadButton.href = downloadLink;
    downloadButton.download = fileName;
    downloadButton.textContent = 'Baixar arquivo convertido';
    downloadButton.style.display = 'inline-block';
    downloadButton.style.backgroundColor = '#4CAF50';
    downloadButton.style.color = 'white';
    downloadButton.style.padding = '10px 20px';
    downloadButton.style.textDecoration = 'none';
    downloadButton.style.borderRadius = '4px';
    downloadButton.style.cursor = 'pointer';

    container.appendChild(downloadButton);
    resultDiv.appendChild(container);
}

// Função para processar o upload do arquivo
async function handleFormSubmit() {
    console.log('handleFormSubmit chamado');

    const file = fileInput.files[0];
    if (!file) {
        displayError('Por favor, selecione um arquivo.');
        return;
    }

    displayStatus('Convertendo arquivo, por favor aguarde...');
    console.log('Mensagem "convertendo" exibida.');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        // Verificar se a resposta do servidor foi bem-sucedida
        if (!response.ok) {
            throw new Error('Erro na resposta da API');
        }

        const result = await response.json();
        console.log('Resposta da API:', result);

        if (result.success && result.downloadLink) {
            const fileName = `${file.name.split('.')[0]}_convertido.docx`;
            createDownloadButton(result.downloadLink, fileName);
        } else {
            throw new Error(result.message || 'Erro ao converter arquivo');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        displayError(error.message || 'Erro ao processar o arquivo. Tente novamente.');
    }
}

// Garantir que o evento clique seja corretamente interceptado
convertBtn.addEventListener('click', (event) => {
    console.log('Botão converter clicado!');
    event.preventDefault(); // Adicionado por segurança
    handleFormSubmit();
});

// Feedback ao selecionar arquivo
fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
        displayStatus(`Arquivo selecionado: ${file.name}`);
        console.log('Arquivo selecionado:', file.name);
    }
});

// Impedir qualquer envio de formulário ou evento de recarregamento da página
window.addEventListener('beforeunload', (event) => {
    event.preventDefault();
    console.log('Evento de beforeunload capturado');
    event.returnValue = '';
});