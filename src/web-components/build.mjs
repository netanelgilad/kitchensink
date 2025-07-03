#!/usr/bin/env node

// Simple build script for Wix Web Components
// Run with: node build.mjs

import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildWebComponents() {
  try {
    console.log('🔨 Building Wix Web Components...');

    const result = await build({
      entryPoints: [path.join(__dirname, 'index.ts')],
      bundle: true,
      outfile: path.join(__dirname, 'dist', 'wix-web-components.js'),
      format: 'iife',
      globalName: 'WixWebComponents',
      platform: 'browser',
      target: 'es2020',
      minify: false, // Set to true for production
      sourcemap: true,
      external: [
        // These should be available globally via Wix SDK
        '@wix/stores',
        '@wix/services-manager', 
        '@wix/services-definitions'
      ],
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      banner: {
        js: `
/**
 * Wix Web Components v1.0.0
 * Modern, reactive web components for Wix stores
 * 
 * Usage:
 * 1. Include Wix SDK: <script src="https://unpkg.com/@wix/init-sdk-context/build/site.iife.js"></script>
 * 2. Include this bundle: <script src="./wix-web-components.js"></script>
 * 3. Use components: <wix-product product-slug="your-slug">...</wix-product>
 */
        `.trim()
      }
    });

    if (result.errors.length > 0) {
      console.error('❌ Build errors:', result.errors);
      process.exit(1);
    }

    if (result.warnings.length > 0) {
      console.warn('⚠️ Build warnings:', result.warnings);
    }

    console.log('✅ Build complete!');
    console.log(`📦 Bundle: ${path.join(__dirname, 'dist', 'wix-web-components.js')}`);
    console.log(`📊 Size: ${(result.metafile?.outputs?.[Object.keys(result.metafile.outputs)[0]]?.bytes || 0) / 1024}KB`);

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Create output directory if it doesn't exist
import fs from 'fs';
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

buildWebComponents(); 