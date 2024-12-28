// utils.js
import init, { AvifEncoder } from './pkg/avif_converter.js';

let wasmModule;
init().then(module => {
    wasmModule = module;
});

export async function compressImage(file, onProgress) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate new dimensions while maintaining aspect ratio
            const maxWidth = 3840;
            const maxHeight = 2160;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            try {
                const imageData = ctx.getImageData(0, 0, width, height);
                const encoder = new AvifEncoder();
                encoder.set_quality(80);
                
                const avifData = await encoder.encode_image_with_progress(
                    imageData.data,
                    width,
                    height,
                    (progress) => {
                        onProgress(progress);
                    }
                );

                const blob = new Blob([avifData], { type: 'image/avif' });
                resolve(blob);
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
    });
}