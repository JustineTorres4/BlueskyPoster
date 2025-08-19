const { ipcRenderer } = require('electron');

const imageInput = document.getElementById('postImages');
const imageList = document.getElementById('imageList');

imageInput.addEventListener('change', function () {
    imageList.innerHTML = '';

    const imageFiles = Array.from(imageInput.files);

    if (imageFiles.length > 4) {
        alert("Você só pode blucetar 4 imagens.");
        imageInput.value = '';
        return;
    }

    imageFiles.forEach((file, index) => {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-item';

        const reader = new FileReader();
        reader.onload = function (e) {
            const imageThumbnail = document.createElement('img');
            imageThumbnail.src = e.target.result;
            imageThumbnail.style.width = '100px'; 
            imageThumbnail.style.height = '100px'; 
            imageThumbnail.alt = `Thumbnail of ${file.name}`;

            imageContainer.appendChild(imageThumbnail);
        };

        reader.readAsDataURL(file);

        const altTextLabel = document.createElement('label');
        altTextLabel.innerHTML = `Alt Text da imagem ${index + 1}:`;

        const altTextInput = document.createElement('input');
        altTextInput.type = 'text';
        altTextInput.id = `altText${index}`;
        altTextInput.placeholder = "Insira o alt text da imagem";

        altTextInput.style.backgroundColor = '#1f1f1f';
        altTextInput.style.color = '#e0e0e0';
        altTextInput.style.border = '1px solid #333';
        altTextInput.style.padding = '10px';


        imageContainer.appendChild(altTextLabel);
        imageContainer.appendChild(altTextInput);
        imageContainer.appendChild(document.createElement('br'));
        imageContainer.appendChild(document.createElement('br'));

        imageList.appendChild(imageContainer);
    });
});

document.getElementById('useCurrentDate').addEventListener('change', function () {
    const isChecked = this.checked;
    const customDateLabel = document.getElementById('customDateLabel');
    const customDateInput = document.getElementById('customDate');

    if (isChecked) {
        customDateLabel.style.display = 'none';
        customDateInput.style.display = 'none';
    } else {
        customDateLabel.style.display = 'block';
        customDateInput.style.display = 'block';
    }
});

document.getElementById('postForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const text = document.getElementById('postText').value;
    const imageFiles = Array.from(imageInput.files);
    const useCurrentDate = document.getElementById('useCurrentDate').checked;
    const customDate = document.getElementById('customDate').value;

    if (imageFiles.length > 4) {
        alert("Você só pode blucetar 4 imagens.");
        return;
    }

    const images = imageFiles.map(file => file.path);
    const altTexts = imageFiles.map((file, index) => {
        const altTextInput = document.getElementById(`altText${index}`);
        return altTextInput ? altTextInput.value : '';
    });

    let postDate;
    if (useCurrentDate) {
        postDate = new Date().toISOString();
    } else if (customDate) {
        postDate = new Date(customDate).toISOString();
    } else {
        alert("Selecione uma data válida.");
        return;
    }

    const postData = {
        text,
        images,
        altTexts,
        postDate
    };

    const result = await ipcRenderer.invoke('post-to-bluesky', postData);

    const statusMessage = document.getElementById('statusMessage');
    if (result.success) {
        statusMessage.textContent = "Blucetou com sucesso!";
    } else {
        statusMessage.textContent = `Não conseguiu blucetar: ${result.error}`;
    }
});
