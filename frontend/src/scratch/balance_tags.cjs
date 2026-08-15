const fs = require('fs');

const fileContent = fs.readFileSync('e:\\LyangPOS\\LyangPOS\\frontend\\src\\pages\\MobileInventory.jsx', 'utf8');

// Parse JSX tags but keep track of line numbers in the original content!
const tagRegex = /<(\/)?([a-zA-Z0-9.:\-]+)([^>]*?)>/g;
let match;
const stack = [];

function getLine(index) {
    return fileContent.substring(0, index).split('\n').length;
}

while ((match = tagRegex.exec(fileContent)) !== null) {
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
    
    // Check if the match is inside a comment or a string literal
    const index = match.index;
    const line = getLine(index);
    
    // Quick check if in comment
    const precedingText = fileContent.substring(0, index);
    const lastNewline = precedingText.lastIndexOf('\n');
    const lineStart = precedingText.substring(lastNewline === -1 ? 0 : lastNewline);
    if (lineStart.trim().startsWith('//') || lineStart.trim().startsWith('*')) {
        continue;
    }
    
    if (isClose) {
        const last = stack.pop();
        if (!last) {
            console.log(`Error: Closed </${tagName}> on line ${line} but nothing was open!`);
        } else if (last.name !== tagName) {
            console.log(`Error: Closed </${tagName}> on line ${line} but expected </${last.name}> (opened on line ${last.line})`);
            stack.push(last);
        }
    } else {
        stack.push({ name: tagName, line: line, index: index });
    }
}

while (stack.length > 0) {
    const left = stack.pop();
    console.log(`Error: Unclosed <${left.name}> opened on line ${left.line}`);
}
