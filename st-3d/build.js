// node build.js -> dist/index.html (open locally) and dist/artifact.html (page body for publishing)
const fs = require('fs'), path = require('path');
const R = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const models = fs.readdirSync(path.join(__dirname, 'src')).filter(f => /^model_.*\.js$/.test(f)).sort().map(f => 'src/' + f);
const files = ['vendor/three.min.js', 'vendor/OrbitControls.js', 'src/content/rows.js', 'src/content/records.js', 'src/content/compare.js', 'src/content/engine.js', 'src/kit.js', ...models, 'src/viewer.js', 'src/app3d.js'];
const js = files.map(f => '<script>\n' + R(f).replace(/<\/script>/g, '<\\/script>') + '\n</script>').join('\n');
const fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Barlow+Semi+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap">';
const page = `<title>Instrument Lab 3D</title>\n${fonts}\n<style>\n${R('src/styles.css')}\n</style>\n<div id="app"></div>\n${js}\n`;
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/artifact.html'), page);
fs.writeFileSync(path.join(__dirname, 'dist/index.html'), `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0}</style></head><body>\n${page}</body></html>\n`);
const harness = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;background:#1b242c}#v{width:100vw;height:100vh}</style></head><body><div id="v"></div>\n<script src="../vendor/three.min.js"></script><script src="../vendor/OrbitControls.js"></script><script src="../src/kit.js"></script>\n${models.map(m => `<script src="../${m}"></script>`).join('')}\n<script src="../src/viewer.js"></script>\n<script>const id = new URLSearchParams(location.search).get('model') || 'babcock'; window.viewer = new ST3D.Viewer(document.getElementById('v'), { preserve: true }); viewer.load(id);</script></body></html>\n`;
fs.writeFileSync(path.join(__dirname, 'tests/harness.html'), harness);
console.log('built', (page.length / 1024) | 0, 'KB;', models.length, 'model files');
