import { backend } from "declarations/backend";

let currentAvatarBlob = null;

async function generateAvatar(imageData) {
    const spinner = document.getElementById('spinner');
    spinner.classList.remove('d-none');

    try {
        // Generate a unique seed from the image data
        const seed = Math.random().toString(36).substring(7);
        
        // Generate avatar using DiceBear API with more realistic options
        const options = [
            'mouth[]=smile,serious,twinkle',
            'eyes[]=normal,happy,wink',
            'skin[]=light,pale,dark,brown,black',
            'hair[]=long,short,curly,straight,wavy',
            'hairColor[]=auburn,black,blonde,brown,red',
            'accessories[]=glasses,sunglasses,none',
            'clothing[]=blazer,sweater,hoodie,shirt',
            'clothingColor[]=black,blue,gray,red,white',
            'background[]=gradientColors',
            'style=transparent'
        ].join('&');
        
        const response = await fetch(`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&${options}`);
        const svgBlob = await response.blob();
        
        // Convert SVG to PNG using canvas with higher resolution
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = URL.createObjectURL(svgBlob);
        });

        // Increase canvas size for better quality
        canvas.width = 400;
        canvas.height = 400;
        
        // Set background and smoothing
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw image with slight padding
        const padding = 20;
        ctx.drawImage(img, padding, padding, canvas.width - (padding * 2), canvas.height - (padding * 2));
        
        // Convert canvas to blob with higher quality
        const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
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
