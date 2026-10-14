// Publish an explicit list of website files, never the repository itself.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.resolve(root, 'hosting-public');
const files = [
  'index.html', 'checkout.html', 'forwarding.html', 'topup.html',
  'faq.html', 'contact.html', 'testimoni.html',
  'style.css', 'site.css', 'script.js', 'site.js', 'testimoni.js'
];
const imageFolders = [
  'Footer_Photo', 'Others_Photo', 'Ser_Card_Photo',
  'Testi_Card_Photo', 'Testi_Photo', 'Testi_Optimized'
];
const allowedImages = /\.(jpe?g|png|webp|svg|ico)$/i;

// Check source inputs before touching the generated output.
for (const file of files) {
  if (!fs.statSync(path.join(root, file)).isFile()) throw new Error(`Missing website file: ${file}`);
}
for (const folder of imageFolders) {
  if (!fs.statSync(path.join(root, folder)).isDirectory()) throw new Error(`Missing image folder: ${folder}`);
}
// Catch new photos whose optimized copies have not been generated yet.
for (const name of fs.readdirSync(path.join(root, 'Testi_Photo')).filter(name => /^doc\d+\.jpg$/i.test(name))) {
  for (const suffix of ['-thumb.webp', '.webp']) {
    if (!fs.existsSync(path.join(root, 'Testi_Optimized', path.parse(name).name + suffix))) {
      throw new Error('Missing optimized photo for ' + name + '. Run npm run optimize:photos first.');
    }
  }
}
for (let index = 1; index <= 8; index++) {
  if (!fs.existsSync(path.join(root, 'Testi_Optimized', 'story' + index + '.webp'))) throw new Error('Missing optimized carousel photo. Run npm run optimize:photos first.');
}
if (path.dirname(output) !== root || path.basename(output) !== 'hosting-public') throw new Error('Unexpected deployment directory.');
if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) throw new Error('Deployment directory cannot be a symlink.');

// Empty only this dedicated generated directory. Never follow symbolic links.
function clearGeneratedDirectory(directory) {
  if (directory !== output && !directory.startsWith(output + path.sep)) throw new Error('Path outside deployment directory.');
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Unexpected symlink in deployment directory.');
    if (entry.isDirectory()) {
      clearGeneratedDirectory(fullPath);
      fs.rmdirSync(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }
}
fs.mkdirSync(output, { recursive: true });
clearGeneratedDirectory(output);
let copied = 0;
for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
  copied++;
}
for (const folder of imageFolders) {
  fs.mkdirSync(path.join(output, folder));
  for (const entry of fs.readdirSync(path.join(root, folder), { withFileTypes: true })) {
    if (!entry.isFile() || !allowedImages.test(entry.name)) continue;
    fs.copyFileSync(path.join(root, folder, entry.name), path.join(output, folder, entry.name));
    copied++;
  }
}
console.log(`Prepared ${copied} public website files in hosting-public/.`);
