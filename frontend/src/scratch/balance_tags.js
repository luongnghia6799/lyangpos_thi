const fs = require('fs');

const fileContent = fs.readFileSync('e:\\LyangPOS\\LyangPOS\\frontend\\src\\pages\\MobileInventory.jsx', 'utf8');

// A list of tokens we care about
const tagRegex = /<(\/)?([a-zA-Z0-9.:\-]+)([^>]*?)>/g;
let match;
const stack = [];

// Strip strings and comments
let cleanContent = fileContent
    .replace(/\/\*[\s\S]*?\*\//g, '') 
    .replace(/\/\/.*/g, '')           
    .replace(/`[\s\S]*?`/g, '""')     
    .replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""') 
    .replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, "''"); 

function getLine(index) {
    return fileContent.substring(0, index).split('\n').length;
}

while ((match = tagRegex.exec(cleanContent)) !== null) {
    const isClose = !!match[1];
    const tagName = match[2];
    const attrs = match[3];
    
    // Ignore self-closing tag formats
    if (attrs.trim().endsWith('/')) {
        continue;
    }
    // Ignore standard self-closing HTML tag names in lowercase
    if (['input', 'img', 'br', 'hr', 'meta', 'link'].includes(tagName.toLowerCase())) {
        continue;
    }
    
    const line = getLine(match.index);
    
    if (isClose) {
        const last = stack.pop();
        if (!last) {
            console.log(`Error: Closed </${tagName}> on line ${line} but nothing was open!`);
        } else if (last.name !== tagName) {
            console.log(`Error: Closed </${tagName}> on line ${line} but expected </${last.name}> (opened on line ${last.line})`);
            // Put it back to try to recover
            stack.push(last);
        }
    } else {
        stack.push({ name: tagName, line: line, index: match.index });
    }
}

while (stack.length > 0) {
    const left = stack.pop();
    console.log(`Error: Unclosed <${left.name}> opened on line ${left.line}`);
}
