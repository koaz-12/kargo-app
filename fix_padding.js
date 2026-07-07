const fs = require('fs'); 
const path = require('path'); 
function walk(dir) { 
    let results = []; 
    const list = fs.readdirSync(dir); 
    list.forEach(file => { 
        file = path.resolve(dir, file); 
        const stat = fs.statSync(file); 
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file)); 
        } else if (file.endsWith('.tsx')) { 
            results.push(file); 
        } 
    }); 
    return results; 
} 
const files = walk('app'); 
let modifiedCount = 0; 
files.forEach(file => { 
    let content = fs.readFileSync(file, 'utf8'); 
    if (content.includes('sticky top-0') && !content.includes('pr-16')) { 
        content = content.replace(/(className=".*?)px-4(.*?sticky top-0.*?")/, '$1pl-4 pr-16$2'); 
        content = content.replace(/(className=".*?sticky top-0.*?)px-4(.*?")/, '$1pl-4 pr-16$2'); 
        content = content.replace(/(className=".*?sticky top-0.*?)px-5(.*?")/, '$1pl-5 pr-16$2'); 
        fs.writeFileSync(file, content); 
        console.log('Modified', file); 
        modifiedCount++; 
    } 
}); 
console.log('Total modified:', modifiedCount);
