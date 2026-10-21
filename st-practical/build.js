// Inlines everything into dist/*.html (artifact page + standalone file). Usage: node build.js
const fs = require('fs'), path = require('path');
const R = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const photoMap = { sponge: 'sponge', 'smooth-long': 'smooth', sims: 'sims', auvard: 'auvard', jacobs: 'jacobs', skene: 'skene', sound: 'sound', cervdil: 'hanks', goodell: 'goodell', endocervical: 'endocervical', endometrial: 'endometrial', punch: 'punch', polyp: 'polyp', bozeman: 'bozeman', bowls: 'bowls' };
const photos = {};
for (const [id, f] of Object.entries(photoMap)) photos[id] = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'photos', f + '.jpg')).toString('base64');
const scripts = ['src/rows.js', 'src/records.js', 'src/compare.js', 'src/sources.js', 'src/engine.js', 'src/app.js'];
const js = scripts.map(f => '<script>\n' + R(f).replace(/<\/script>/g, '<\\/script>') + '\n</script>').join('\n');
const fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Barlow+Semi+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap">';
const page = `<title>Surgical Instrument Practical</title>\n${fonts}\n<style>\n${R('src/styles.css')}\n</style>\n<div id="app"></div>\n<script>window.ST_PHOTOS=${JSON.stringify(photos)};</script>\n${js}\n`;
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/artifact.html'), page);
fs.writeFileSync(path.join(__dirname, 'dist/index.html'), `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0}</style></head><body>\n${page}</body></html>\n`);
console.log('built', (page.length / 1024) | 0, 'KB');
