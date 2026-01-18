#!/usr/bin/env node

/**
 * Generate extension icons from Delulu logo SVG
 * Run: pnpm generate-icons
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="256" cy="256" r="256" fill="#6366f1"/>
  <g transform="translate(142, 126) scale(1)">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M73.9491 2.85403C70.6351 0.310031 102.319 -0.717962 118 1.42404C148.932 5.65011 176.901 10.4076 202.811 28.369C221.302 41.1822 226.366 66.7097 226.444 87.5C226.527 109.533 222.484 132.314 214.949 153C200.84 191.731 178.883 227.431 143.23 249.288C138.837 251.982 124.035 258.344 118.931 259.732C117.304 260.174 116.418 260.415 116.148 260.11C115.826 259.746 116.382 258.605 117.6 256.101C123.785 243.386 125.708 237.738 128.53 224C133.907 197.822 121.728 186.374 105.064 201.941C94.5848 211.722 84.8848 219.589 72.8521 226.814C51.0383 239.912 29.6319 237.212 7.25009 229.931C-0.835913 227.301 -1.37691 226.676 3.08609 225.12C20.1071 219.186 46.1771 186.441 44.6081 172.965C43.7091 165.248 38.5301 163.983 26.2051 168.47C3.81309 176.622 -3.89391 158.87 13.0001 138.054C32.7562 113.716 62.7723 98.2116 80.1471 71.947C95.2917 49.0446 97.594 20.9976 73.9491 2.85403ZM120.474 50.052C108.916 72.86 132.246 102.518 152.095 90.25C156.776 87.357 163.609 79.703 161.991 79.164C151.685 75.7187 140.135 62.1023 132.801 54.687C123.098 44.874 123.098 44.874 120.474 50.052ZM203 63.664C198.969 70.077 193.721 74.716 186.257 78.465C180.187 81.513 180.535 85.231 187.499 91.75C193.488 97.357 207.5 89.5 210 81C211 76.5 211.747 57.5983 207.007 58.048C206.728 58.074 204.925 60.602 203 63.664ZM127.954 116.75C125.914 129.28 140.379 140.485 151 143.626C167.773 148.585 184.832 141.643 196.159 125.25C199.637 120.217 199.304 119.917 194.812 124.037C178.831 138.694 164 136 155 134C146 132 128.093 115.896 127.954 116.75Z" fill="white"/>
  </g>
</svg>`;

const sizes = [16, 32, 48, 96, 128];

async function generateIcons() {
  console.log('🎨 Generating Delulu extension icons...\n');

  try {
    // Check if sharp is installed
    let sharp;
    try {
      sharp = (await import('sharp')).default;
    } catch (error) {
      console.log('📦 Installing sharp...');
      execSync('pnpm add -D sharp', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      sharp = (await import('sharp')).default;
      console.log('✓ Sharp installed\n');
    }

    const iconDir = path.join(__dirname, '../public/icon');

    // Ensure icon directory exists
    if (!fs.existsSync(iconDir)) {
      fs.mkdirSync(iconDir, { recursive: true });
    }

    // Generate each size
    for (const size of sizes) {
      const outputPath = path.join(iconDir, `${size}.png`);

      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${size}x${size} → ${path.relative(process.cwd(), outputPath)}`);
    }

    console.log('\n✨ All icons generated successfully!');
    console.log('📦 Run "pnpm build" to rebuild the extension with the new icons.');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
