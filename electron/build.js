const packager = require('electron-packager');
const fs = require('fs');
const path = require('path');

async function build() {
  console.log("Copying backend to electron directory...");
  if (fs.existsSync('backend')) {
    fs.rmSync('backend', { recursive: true, force: true });
  }
  
  fs.cpSync('../backend', 'backend', {
    recursive: true,
    filter: (src, dest) => {
      if (src.includes('.venv')) return false;
      if (src.includes('__pycache__')) return false;
      return true;
    }
  });

  console.log("Packaging with electron-packager...");
  const appPaths = await packager({
    dir: '.',
    name: 'Thermodynamic Instability Dashboard',
    platform: 'win32',
    arch: 'x64',
    out: 'dist',
    overwrite: true,
    icon: 'build/icon.ico',
    ignore: [
      /^\/dist/,
      /^\/\.venv/,
      /^\/build\.js/
    ]
  });
  
  console.log(`App packaged successfully at ${appPaths[0]}`);
}

build().catch(err => {
  console.error("Build failed:", err);
  process.exit(1);
});
