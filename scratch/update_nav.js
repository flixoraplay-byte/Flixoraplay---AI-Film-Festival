const fs = require('fs');
const path = require('path');

const rootDir = 'd:/flixoraplay';

const navbar = `<nav id="main-nav">
    <div class="container nav-inner">
      <a href="/index.html" class="nav-logo">Flixora<span style="color:var(--text-3);">Play</span></a>
      <div class="nav-links">
        <a href="/index.html" class="nav-link">Home</a>
        <a href="/pages/browse.html" class="nav-link">Browse</a>
        <a href="/pages/leaderboard.html" class="nav-link">Leaderboard</a>
      </div>
      <div class="nav-actions">
        <a href="/auth/login.html" class="nav-link" style="color:#fff;">Sign In</a>
        <a href="/competitions/create-competition.html" class="btn btn-primary" style="font-weight:600;">Host Competition</a>
      </div>
    </div>
  </nav>`;

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === '.wrangler' || file === 'scratch') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const htmlFiles = findHtmlFiles(rootDir);

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Replace <nav>...</nav> using regex
  const navRegex = /<nav[^>]*>[\s\S]*?<\/nav>/;
  
  if (navRegex.test(content)) {
    // If it's index.html, we also replace it just to be perfectly uniform 
    // (though it already has this navbar)
    content = content.replace(navRegex, navbar);
    fs.writeFileSync(file, content);
    console.log('Updated nav in:', file);
  }
}
