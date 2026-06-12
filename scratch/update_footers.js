const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('scratch') && !file.includes('.wrangler')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.html')) results.push(file);
    }
  });
  return results;
}

const files = walk('d:/flixoraplay');

const snippet = `
    <div class="container" style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); display:flex; justify-content:center; gap:20px; flex-wrap:wrap; font-size:0.75rem; color:var(--text-4);">
        <a href="/pages/terms.html" style="color:var(--text-4);">Terms & Conditions</a>
        <a href="/pages/privacy.html" style="color:var(--text-4);">Privacy Policy</a>
        <a href="/pages/refunds.html" style="color:var(--text-4);">Cancellation & Refunds</a>
        <a href="/pages/contact.html" style="color:var(--text-4);">Contact Us</a>
    </div>
  </footer>`;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (!content.includes('Cancellation & Refunds') && content.includes('</footer>')) {
    // Only replace the last occurrence of </footer> if there are multiple, but usually there's only one.
    content = content.replace(/<\/footer>/g, snippet);
    fs.writeFileSync(f, content);
    console.log('Updated ' + f);
  }
});
