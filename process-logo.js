const sharp = require('sharp');
const fs = require('fs');

async function processLogo() {
  const inputPath = './public/logo.jpg';
  
  // 1. Read image raw pixels
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  
  // Create buffer for transparent dark version (original text on transparent)
  const darkBuf = Buffer.from(data);
  // Create buffer for transparent white/silver version (white text on transparent)
  const whiteBuf = Buffer.from(data);

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Check if pixel is white/near-white background
    if (r > 240 && g > 240 && b > 240) {
      darkBuf[i + 3] = 0; // fully transparent
      whiteBuf[i + 3] = 0;
    } else {
      // Smooth alpha for antialiasing edges
      const brightness = (r + g + b) / 3;
      if (brightness > 210) {
        const alpha = Math.max(0, 255 - Math.round(((brightness - 210) / 30) * 255));
        darkBuf[i + 3] = alpha;
        whiteBuf[i + 3] = alpha;
      }
      
      // For whiteBuf, invert darkness to crisp white/light silver
      // If pixel was dark grey (e.g. ~45), make it white/silver (e.g. 240-255)
      // If pixel was slate grey (e.g. ~140), make it light platinum (~200)
      const grey = 255 - Math.round(brightness * 0.4);
      whiteBuf[i] = grey;
      whiteBuf[i + 1] = grey;
      whiteBuf[i + 2] = grey;
    }
  }

  // Save dark transparent logo trimmed
  await sharp(darkBuf, { raw: { width, height, channels: 4 } })
    .trim()
    .png()
    .toFile('./public/logo-dark.png');

  // Save white transparent logo trimmed
  await sharp(whiteBuf, { raw: { width, height, channels: 4 } })
    .trim()
    .png()
    .toFile('./public/logo-white.png');

  console.log('Logos processed successfully!');
}

processLogo().catch(console.error);
