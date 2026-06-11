const fs = require('fs');
const path = require('path');

const rootDir = 'd:/flixoraplay';

const fileMap = {
  'about.html': 'pages/about.html',
  'adarena.html': 'adarena/adarena.html',
  'arena.html': 'competitions/arena.html',
  'brief.html': 'adarena/brief.html',
  'browse.html': 'pages/browse.html',
  'checkout.html': 'user/checkout.html',
  'competition.html': 'competitions/competition.html',
  'create-brief.html': 'adarena/create-brief.html',
  'create-competition.html': 'competitions/create-competition.html',
  'dashboard.html': 'user/dashboard.html',
  'index.html': 'index.html',
  'judge.html': 'competitions/judge.html',
  'leaderboard.html': 'pages/leaderboard.html',
  'login.html': 'auth/login.html',
  'notifications.html': 'user/notifications.html',
  'profile.html': 'user/profile.html',
  'register.html': 'auth/register.html',
  'settings.html': 'user/settings.html'
};

// Create folders
const folders = [...new Set(Object.values(fileMap).map(p => path.dirname(p)))];
folders.forEach(folder => {
  const fullPath = path.join(rootDir, folder);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Update content function
function updatePaths(content, filePath) {
  let newContent = content;

  // Replace links to CSS/JS/Assets
  newContent = newContent.replace(/href="css\//g, 'href="/css/');
  newContent = newContent.replace(/src="js\//g, 'src="/js/');
  newContent = newContent.replace(/src="assets\//g, 'src="/assets/');

  // Replace internal HTML links
  for (const [oldName, newPath] of Object.entries(fileMap)) {
    const rootRelPath = '/' + newPath;
    
    // href="oldName?..." or href="oldName"
    const hrefRegex = new RegExp(`href=["']${oldName}((\\?|#)[^"']*)?["']`, 'g');
    newContent = newContent.replace(hrefRegex, `href="${rootRelPath}$1"`);

    // navigate('oldName?...') or navigate("oldName")
    const navRegex = new RegExp(`navigate\\(['"]${oldName}((\\?|#)[^'"]*)?['"]\\)`, 'g');
    newContent = newContent.replace(navRegex, `navigate('${rootRelPath}$1')`);

    // window.location.href = 'oldName'
    const locRegex = new RegExp(`window\\.location(\\.href)?\\s*=\\s*['"]${oldName}((\\?|#)[^'"]*)?['"]`, 'g');
    newContent = newContent.replace(locRegex, `window.location.href = '${rootRelPath}$1'`);
    
    // navigate(`oldName?...`)
    const navTickRegex = new RegExp(`navigate\\(\`${oldName}((\\?|#)[^\`]*)\`\\)`, 'g');
    newContent = newContent.replace(navTickRegex, `navigate(\`${rootRelPath}$1\`)`);

    // window.location.href = `oldName`
    const locTickRegex = new RegExp(`window\\.location(\\.href)?\\s*=\\s*\`${oldName}((\\?|#)[^\`]*)\``, 'g');
    newContent = newContent.replace(locTickRegex, `window.location.href = \`${rootRelPath}$1\``);
  }

  return newContent;
}

// 1. Move and update HTML files
for (const [oldName, newPath] of Object.entries(fileMap)) {
  const oldFullPath = path.join(rootDir, oldName);
  const newFullPath = path.join(rootDir, newPath);

  if (fs.existsSync(oldFullPath)) {
    let content = fs.readFileSync(oldFullPath, 'utf-8');
    content = updatePaths(content, newPath);
    
    if (oldFullPath !== newFullPath) {
      fs.writeFileSync(newFullPath, content);
      fs.unlinkSync(oldFullPath);
      console.log(`Moved and updated ${oldName} -> ${newPath}`);
    } else {
      fs.writeFileSync(newFullPath, content);
      console.log(`Updated ${oldName}`);
    }
  } else {
    // Might have already been moved on a previous run
    if (fs.existsSync(newFullPath)) {
        let content = fs.readFileSync(newFullPath, 'utf-8');
        content = updatePaths(content, newPath);
        fs.writeFileSync(newFullPath, content);
        console.log(`Re-updated ${newPath}`);
    }
  }
}

// 2. Update js/app.js for navigate() calls
const appJsPath = path.join(rootDir, 'js/app.js');
if (fs.existsSync(appJsPath)) {
  let appJsContent = fs.readFileSync(appJsPath, 'utf-8');
  appJsContent = updatePaths(appJsContent, 'js/app.js');
  fs.writeFileSync(appJsPath, appJsContent);
  console.log(`Updated js/app.js`);
}

// 3. Optional: update notifications.js inside functions/api
const notifJsPath = path.join(rootDir, 'functions/api/notifications.js');
if (fs.existsSync(notifJsPath)) {
    let notifJsContent = fs.readFileSync(notifJsPath, 'utf-8');
    notifJsContent = updatePaths(notifJsContent, 'functions/api/notifications.js');
    fs.writeFileSync(notifJsPath, notifJsContent);
    console.log(`Updated functions/api/notifications.js`);
}

// 4. Update entries.js inside functions/api for notification link
const entriesJsPath = path.join(rootDir, 'functions/api/entries.js');
if (fs.existsSync(entriesJsPath)) {
    let content = fs.readFileSync(entriesJsPath, 'utf-8');
    content = updatePaths(content, 'functions/api/entries.js');
    fs.writeFileSync(entriesJsPath, content);
    console.log(`Updated functions/api/entries.js`);
}

console.log('Reorganization complete.');
