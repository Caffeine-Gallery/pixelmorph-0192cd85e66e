import { backend } from "declarations/backend";

let currentAvatarBlob = null;

async function generateAvatar(imageData) {
    const spinner = document.getElementById('spinner');
    spinner.classList.remove('d-none');

    try {
        // Generate a unique seed from the image data
        const seed = Math.random().toString(36).substring(7);
        
        // Generate avatar using DiceBear API
        const response = await fetch(`https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`);
        const svgBlob = await response.blob();
        
        // Convert SVG to PNG using canvas
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = URL.createObjectURL(svgBlob);
        });

        canvas.width = 200;
        canvas.height = 200;
        ctx.drawImage(img, 0, 0, 200, 200);
        
        // Convert canvas to blob
        const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const arrayBuffer = await pngBlob.arrayBuffer();
        
        // Store in backend
        const result = await backend.storeAvatar(Array.from(new Uint8Array(arrayBuffer)));
        
        if (result) {
            currentAvatarBlob = pngBlob;
            const avatarUrl = URL.createObjectURL(pngBlob);
            document.getElementById('avatarPreview').src = avatarUrl;
            document.getElementById('downloadBtn').style.display = 'inline-block';
            
            // Update history
            loadAvatarHistory();
        }
    } catch (error) {
        console.error('Error generating avatar:', error);
        alert('Failed to generate avatar. Please try again.');
    } finally {
        spinner.classList.add('d-none');
    }
}

async function loadAvatarHistory() {
    try {
        const history = await backend.getAvatarHistory();
        const historyContainer = document.getElementById('avatarHistory');
        historyContainer.innerHTML = '';

        history.forEach((avatarData, index) => {
            const blob = new Blob([new Uint8Array(avatarData)], { type: 'image/png' });
            const url = URL.createObjectURL(blob);

            const div = document.createElement('div');
            div.className = 'col-4 col-md-3 col-lg-2 history-item';
            div.innerHTML = `
                <img src="${url}" class="history-image" alt="Avatar ${index + 1}">
            `;
            historyContainer.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Event Listeners
document.getElementById('photoInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('originalPreview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('generateBtn').addEventListener('click', async () => {
    const photoInput = document.getElementById('photoInput');
    if (photoInput.files.length === 0) {
        alert('Please select a photo first');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        generateAvatar(e.target.result);
    };
    reader.readAsDataURL(photoInput.files[0]);
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    if (currentAvatarBlob) {
        const url = URL.createObjectURL(currentAvatarBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'avatar.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});

// Load avatar history on page load
window.addEventListener('load', loadAvatarHistory);
