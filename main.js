import { compressImage } from "./utils.js";

class ImageCompressor {
  constructor() {
    this.dropzone = document.getElementById("dropzone");
    this.fileInput = document.getElementById("fileInput");
    this.downloadBtn = document.getElementById("downloadBtn");
    this.reloadBtn = document.getElementById("reloadBtn");
    this.compressedUrl = null;
    this.bindEvents();
  }

  bindEvents() {
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      this.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      this.dropzone.addEventListener(eventName, () => {
        this.dropzone.classList.add("dragging");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      this.dropzone.addEventListener(eventName, () => {
        this.dropzone.classList.remove("dragging");
      });
    });

    this.dropzone.addEventListener("drop", (e) => {
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) {
        this.handleFile(file);
      }
    });

    this.fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleFile(file);
      }
    });

    this.downloadBtn.addEventListener("click", () => {
      if (this.compressedUrl) {
        const link = document.createElement("a");
        link.href = this.compressedUrl;
        const originalName = this.originalFilename || "image";
        const baseName = originalName.replace(/\.[^/.]+$/, "");
        link.download = `${baseName}.avif`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });

    this.reloadBtn.addEventListener("click", () => {
      window.location.reload();
    });
  }

  async handleFile(file) {
    // Clear previous content
    this.dropzone.innerHTML = "";
    this.originalFilename = file.name;

    // Create container
    const previewContainer = document.createElement("div");
    previewContainer.className = "preview-container";

    // Add shimmer background
    const shimmerBg = document.createElement("div");
    shimmerBg.className = "shimmer-background";
    previewContainer.appendChild(shimmerBg);

    // Create blurred background image
    const bgImg = document.createElement("img");
    bgImg.src = URL.createObjectURL(file);
    bgImg.className = "preview-img";
    previewContainer.appendChild(bgImg);

    // Create progress overlay with clear image
    const progressOverlay = document.createElement("div");
    progressOverlay.className = "progress-overlay";
    const clearImg = bgImg.cloneNode(true);
    progressOverlay.appendChild(clearImg);
    previewContainer.appendChild(progressOverlay);

    this.dropzone.appendChild(previewContainer);

    try {
      const compressedBlob = await compressImage(file, (progress) => {
        progressOverlay.style.clipPath = `inset(0 ${100 - progress}% 0 0)`;
        progressOverlay.style.setProperty("--progress", `${progress}%`);
      });

      this.compressedUrl = URL.createObjectURL(compressedBlob);
      this.downloadBtn.classList.remove("hidden");
      this.reloadBtn.classList.remove("hidden");
      // Clean up the effects
      progressOverlay.remove();
      previewContainer.querySelector(".shimmer-background").remove();

      // Remove blur from the original image
      bgImg.style.filter = "none";
    } catch (error) {
      console.error("Compression failed:", error);
      // Show error state
      const errorOverlay = document.createElement("div");
      errorOverlay.className = "error-overlay";
      errorOverlay.textContent = "Compression failed: " + error.message;
      this.dropzone.appendChild(errorOverlay);
    }
  }
}

new ImageCompressor();
