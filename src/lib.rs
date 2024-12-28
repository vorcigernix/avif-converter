use wasm_bindgen::prelude::*;
use ravif::{Encoder, Img, RGBA8};
use std::panic;

#[wasm_bindgen]
pub struct AvifEncoder {
    quality: f32,
    speed: u8,
}

#[wasm_bindgen]
impl AvifEncoder {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        
        AvifEncoder {
            quality: 80.0,
            speed: 8,
        }
    }

    #[wasm_bindgen]
    pub fn set_quality(&mut self, quality: u8) {
        self.quality = quality as f32;
    }

    #[wasm_bindgen]
    pub async fn encode_image(&self, data: &[u8], width: usize, height: usize) -> Result<Vec<u8>, JsValue> {
        let encoder = Encoder::new()
            .with_quality(self.quality)
            .with_speed(self.speed);

        // Convert raw bytes to RGBA slice
        let rgba_data: &[RGBA8] = unsafe { 
            std::slice::from_raw_parts(
                data.as_ptr() as *const RGBA8,
                data.len() / 4
            )
        };
        
        let img = Img::new(rgba_data, width, height);

        encoder.encode_rgba(img)
            .map(|res| res.avif_file)
            .map_err(|e| JsValue::from_str(&format!("Encoding failed: {}", e)))
    }
}