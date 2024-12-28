use wasm_bindgen::prelude::*;
use ravif::{Encoder, Img, RGBA8};
use std::panic;

#[wasm_bindgen]
pub struct AvifEncoder {
    quality: f32,
    speed: u8,
    last_reported_progress: i32,
}

#[wasm_bindgen]
impl AvifEncoder {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        panic::set_hook(Box::new(console_error_panic_hook::hook));
        
        AvifEncoder {
            quality: 80.0,
            speed: 8,
            last_reported_progress: -1,
        }
    }

    #[wasm_bindgen]
    pub fn set_quality(&mut self, quality: u8) {
        self.quality = quality as f32;
    }

    fn should_report_progress(&mut self, current_progress: i32) -> bool {
        if current_progress / 10 > self.last_reported_progress / 10 {
            self.last_reported_progress = current_progress;
            true
        } else {
            false
        }
    }

    fn report_progress(&mut self, progress: f64, callback: &js_sys::Function) -> Result<(), JsValue> {
        let progress_int = (progress * 100.0) as i32;
        if self.should_report_progress(progress_int) {
            callback.call1(
                &JsValue::NULL,
                &JsValue::from_f64(progress_int as f64)
            ).map_err(|e| JsValue::from_str(&format!("Callback error: {:?}", e)))?;
        }
        Ok(())
    }

    #[wasm_bindgen]
    pub async fn encode_image_with_progress(
        &mut self, 
        data: &[u8], 
        width: usize, 
        height: usize,
        callback: &js_sys::Function
    ) -> Result<Vec<u8>, JsValue> {
        let performance = web_sys::window()
            .expect("should have window")
            .performance()
            .expect("should have performance");

        // Report start
        self.report_progress(0.0, callback)?;

        let rgba_data: &[RGBA8] = unsafe { 
            std::slice::from_raw_parts(
                data.as_ptr() as *const RGBA8,
                data.len() / 4
            )
        };

        let encoder = Encoder::new()
            .with_quality(self.quality)
            .with_speed(self.speed);

        let img = Img::new(rgba_data, width, height);

        // Start encoding and update progress periodically
        let pixels = width * height;
        let estimated_time_ms = (pixels as f64 * 0.005) / (self.speed as f64 * 0.2);
        let start_time = performance.now();

        // Report progress periodically while encoding
        loop {
            let elapsed = performance.now() - start_time;
            let progress = (elapsed / estimated_time_ms).min(0.80);
            
            self.report_progress(progress, callback)?;

            if elapsed >= estimated_time_ms {
                break;
            }

            // Wait a bit before next update
            wasm_bindgen_futures::JsFuture::from(js_sys::Promise::new(&mut |resolve, _| {
                web_sys::window()
                    .unwrap()
                    .set_timeout_with_callback_and_timeout_and_arguments_0(
                        &resolve,
                        100,
                    )
                    .unwrap();
            }))
            .await
            .unwrap();
        }

        // Perform the actual encoding
        let result = encoder.encode_rgba(img)
            .map(|res| res.avif_file)
            .map_err(|e| JsValue::from_str(&format!("Encoding failed: {}", e)))?;

        // Report completion
        self.report_progress(1.0, callback)?;

        Ok(result)
    }
}