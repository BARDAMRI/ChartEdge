const fs = require('fs');
const path = require('path');

const extensions = ['.ts', '.tsx', '.css', '.scss'];
const sourceDir = './src';  // שנה בהתאם למבנה הפרויקט
const outputFile = 'combined_code.js';

function getFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) {
      files = files.concat(getFiles(path.join(dir, item.name)));
    } else if (extensions.includes(path.extname(item.name))) {
      files.push(path.join(dir, item.name));
    }
  }
  return files;
}


const files = getFiles(sourceDir);

let combined = '';
for (const file of files) {
  combined += `// File: ${file}\n`;
  combined += fs.readFileSync(file, 'utf8') + '\n\n';
}

fs.writeFileSync(outputFile, combined, 'utf8');
console.log(`All files combined into ${outputFile}`);