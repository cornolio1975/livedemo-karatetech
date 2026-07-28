const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Building project for subdomain deployment (livedemo-karatetech.spsportdatasolution.org, no basePath)...');

try {
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_BASE_PATH: ''
    }
  });

  console.log('Build completed. Packaging /out into root dist.zip...');
  const outPath = path.join(__dirname, 'out');
  const distZipPath = path.join(__dirname, 'dist.zip');

  if (!fs.existsSync(outPath)) {
    throw new Error('Export folder "out" was not found after build!');
  }

  // Remove any nested dist.zip inside out if present
  const nestedZip = path.join(outPath, 'dist.zip');
  if (fs.existsSync(nestedZip)) {
    try { fs.unlinkSync(nestedZip); } catch (e) {}
  }

  if (fs.existsSync(distZipPath)) {
    try {
      fs.unlinkSync(distZipPath);
    } catch (e) {
      console.warn('Warning: Could not delete old dist.zip:', e.message);
    }
  }

  if (process.platform === 'win32') {
    execSync('powershell "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory(\'out\', \'dist.zip\')"', { stdio: 'inherit' });
  } else {
    execSync('zip -r dist.zip out/*', { stdio: 'inherit' });
  }

  if (fs.existsSync(distZipPath)) {
    const stats = fs.statSync(distZipPath);
    console.log(`✅ dist.zip updated successfully in root for Hostinger deployment! (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  } else {
    throw new Error('dist.zip was not created!');
  }
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
