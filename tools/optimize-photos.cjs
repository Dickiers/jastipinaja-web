const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'Testi_Optimized');
async function main() {
  await fs.mkdir(output, { recursive: true });
  const photos = (await fs.readdir(path.join(root, 'Testi_Photo'))).filter(name => /^doc\d+\.jpg$/i.test(name)).sort((a,b) => a.localeCompare(b, undefined, {numeric:true}));
  const report = [];
  for (const name of photos) {
    const input = path.join(root, 'Testi_Photo', name);
    const id = path.parse(name).name;
    const thumb = await sharp(input).rotate().resize(640, 640, {fit:'cover', withoutEnlargement:true}).webp({quality:78, effort:5}).toFile(path.join(output, id + '-thumb.webp'));
    const full = await sharp(input).rotate().resize(1920,1920,{fit:'inside', withoutEnlargement:true}).webp({quality:85, effort:5}).toFile(path.join(output,id + '.webp'));
    report.push({name, original:(await fs.stat(input)).size, thumbnail:thumb.size, enlarged:full.size});
  }
  for (let i=1; i<=8; i++) {
    await sharp(path.join(root,'Testi_Card_Photo',`testi${i}.png`)).rotate().resize(960,960,{fit:'inside',withoutEnlargement:true}).webp({quality:82,effort:5}).toFile(path.join(output,`story${i}.webp`));
  }
  const totals = report.reduce((sum,row) => {for(const key of ['original','thumbnail','enlarged'])sum[key]+=row[key];return sum;},{original:0,thumbnail:0,enlarged:0});
  console.log(JSON.stringify({photos:report.length,bytes:totals,firstEightThumbnailBytes:report.slice(0,8).reduce((s,r)=>s+r.thumbnail,0),largestThumbnail:Math.max(...report.map(r=>r.thumbnail)),largestEnlarged:Math.max(...report.map(r=>r.enlarged))},null,2));
}
main().catch(error => { console.error(error); process.exitCode=1; });
