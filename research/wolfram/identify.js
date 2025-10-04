import 'dotenv/config';
import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

const IMAGE_PATH = "C:\\Users\\shyam\\Downloads\\short.jpg";
const WOLFRAM_BG_REMOVAL_API = 'https://www.wolframcloud.com/obj/shyammm53/clothing-background-removal';
const WOLFRAM_IDENTIFY_API = 'https://www.wolframcloud.com/obj/shyammm53/ImageIdentifyAPI';
const WOLFRAM_COLOR_API = 'https://www.wolframcloud.com/obj/shyammm53/clothing-color-name';

// Color classification function
function rgbToHSV(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;
  
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / diff + 2) / 6;
    } else {
      h = ((r - g) / diff + 4) / 6;
    }
  }
  
  return { h, s, v };
}

function classifyColor(rgb) {
  const [r, g, b] = rgb;
  const { h, s, v } = rgbToHSV(r, g, b);
  
  // Low saturation = grayscale
  if (s < 0.15) {
    if (v < 0.2) return 'Black';
    if (v < 0.4) return 'Dark Gray';
    if (v < 0.6) return 'Gray';
    if (v < 0.8) return 'Light Gray';
    return 'White';
  }
  
  // Classify by hue
  if (h < 15/360 || h > 345/360) return 'Red';
  if (h < 45/360) return 'Orange';
  if (h < 75/360) return 'Yellow';
  if (h < 150/360) return 'Green';
  if (h < 200/360) return 'Cyan';
  if (h < 260/360) return 'Blue';
  if (h < 300/360) return 'Purple';
  if (h < 330/360) return 'Pink';
  return 'Red';
}

function rgbToHex(rgb) {
  return rgb.map(x => x.toString(16).padStart(2, '0')).join('');
}

// async function removeBackground(imagePath) {
//   console.log('🎨 Removing background from image...\n');

//   const form = new FormData();
//   form.append('image', fs.createReadStream(imagePath));
//   form.append('model', 'Salient');  // Best for clothing items
//   form.append('quality', 'Standard');

//   const res = await fetch(WOLFRAM_BG_REMOVAL_API, {
//     method: 'POST',
//     body: form,
//     headers: form.getHeaders(),
//   });

//   if (!res.ok) {
//     throw new Error(`Background removal failed: ${res.statusText}`);
//   }

//   const buffer = await res.buffer();
  
//   // Save the processed image
//   const outputPath = path.join(
//     path.dirname(imagePath),
//     `${path.basename(imagePath, path.extname(imagePath))}_no_bg.png`
//   );
  
//   fs.writeFileSync(outputPath, buffer);
//   console.log(`✅ Background removed! Saved to: ${outputPath}\n`);
  
//   return outputPath;
// }

// async function identifyImage(imagePath) {
//   console.log('🔍 Identifying clothing item...\n');

//   const form = new FormData();
//   form.append('image', fs.createReadStream(imagePath));

//   const res = await fetch(WOLFRAM_IDENTIFY_API, {
//     method: 'POST',
//     body: form,
//     headers: form.getHeaders(),
//   });
//   console.log('Raw response status:', res.status);

//   const text = await res.text();
  
//   try {
//     const results = JSON.parse(text);
    
//     console.log('✅ Recognition Results:\n');
    
//     // Sort by probability (highest first)
//     const sorted = Object.entries(results)
//       .sort(([, a], [, b]) => b - a);
    
//     sorted.forEach(([item, prob], index) => {
//       const percentage = (prob * 100).toFixed(1);
//       const bar = '█'.repeat(Math.round(prob * 20));
//       console.log(`${index + 1}. ${item.padEnd(20)} ${percentage}% ${bar}`);
//     });
    
//     console.log('\n🎯 Best match:', sorted[0][0]);
    
//     return sorted[0][0];
    
//   } catch (err) {
//     console.error('❌ Failed to parse JSON:', err.message);
//     console.log('Response:', text.substring(0, 500));
//     throw err;
//   }
// }
function parseWolframRGB(text) {
  // Example input: NearestColorName[RGBColor[0.626162, 0.587374, 0.578228]]
  const regex = /RGBColor\[\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\s*\]/;
  const match = text.match(regex);
  if (!match) return null;

  // Convert to 0-255 range
  const rgb = match.slice(1, 4).map(v => Math.round(parseFloat(v) * 255));
  return rgb; // [R, G, B]
}


async function analyzeColors(imagePath) {
  console.log('🎨 Analyzing colors...\n');

  const form = new FormData();
  form.append('image', fs.createReadStream(imagePath));
  form.append('numColors', '5');

  const res = await fetch(WOLFRAM_COLOR_API, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });

  const text = await res.text();
  console.log('Raw response', text);

  try {
    const rgb = parseWolframRGB(text);
    if (!rgb) throw new Error('Failed to extract RGB');

    const name = classifyColor(rgb);

    const hex = rgbToHex(rgb); 

    console.log(`🎯 Primary Color: ${name}`);
    console.log(`RGB: ${rgb.join(', ')}  HEX: #${hex}`);

    return {
      dominantColor: name,
      colors: [{ name, rgb, hex }]
    };

  } catch (err) {
    console.error('❌ Failed to parse color data:', err.message);
    console.log('Response:', text.substring(0, 500));
    throw err;
  }
}


async function main() {
  try {
    console.log('🚀 Starting clothing analysis pipeline...\n');
    console.log('📸 Input image:', IMAGE_PATH, '\n');
    console.log('─'.repeat(50), '\n');
    
    // // Step 1: Remove background
    // const processedImagePath = await removeBackground(IMAGE_PATH);
    
    // console.log('─'.repeat(50), '\n');
    
    // // Step 2: Identify the clothing item
    // const bestMatch = await identifyImage(processedImagePath);
    
    console.log('\n' + '─'.repeat(50), '\n');
    
    // Step 3: Analyze colors
    const colorData = await analyzeColors(IMAGE_PATH);
    
    console.log('\n' + '─'.repeat(50));
    console.log('\n✨ Pipeline complete!');
    console.log(`📁 Processed image: ${processedImagePath}`);
    console.log(`🏷️  Type: ${bestMatch}`);
    console.log(`🎨 Primary Color: ${colorData.dominantColor}`);
    
  } catch (error) {
    console.error('\n❌ Error in pipeline:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);