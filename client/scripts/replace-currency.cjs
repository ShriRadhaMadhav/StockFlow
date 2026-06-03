const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../src');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace DollarSign import and usage with IndianRupee
  content = content.replace(/DollarSign/g, 'IndianRupee');
  
  // Replace hardcoded '$' with '₹' (except in template literals ${} variables)
  // We want to match '$' but not '${'
  content = content.replace(/\$(?!\{)/g, '₹');

  // Also fix specific locale/currency strings
  content = content.replace(/'en-US'/g, "'en-IN'");
  content = content.replace(/"en-US"/g, '"en-IN"');
  content = content.replace(/'USD'/g, "'INR'");
  content = content.replace(/"USD"/g, '"INR"');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      walk(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      replaceInFile(filePath);
    }
  });
}

walk(directoryPath);
