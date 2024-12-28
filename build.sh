#!/bin/bash

# Build Rust/WASM
echo "Building Rust/WASM..."
wasm-pack build --target web

# Build frontend
echo "Building frontend..."
npm run build

# Copy WASM files to dist
echo "Copying WASM files to dist..."
cp -r pkg dist/

echo "Build complete!"