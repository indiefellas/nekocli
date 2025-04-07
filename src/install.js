import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getBinaryName() {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === 'win32' && arch === 'x64') {
    return 'neko.exe';
  } else if (platform === 'linux' && arch === 'x64') {
    return 'neko';
  } else if (platform === 'linux' && arch === 'arm64') {
    return 'neko-arm64';
  } else {
    console.error(`Unsupported platform: ${platform} or architecture: ${arch}`);
    process.exit(1);
  }
}

function installBinary() {
  const binaryName = getBinaryName();
  const sourcePath = path.join(__dirname, 'bin', binaryName);
  const destinationPath = path.join(__dirname, 'bin', 'nekoApp');

  try {
    fs.copyFileSync(sourcePath, destinationPath);
    if (process.platform !== 'win32') {
      execSync(`chmod +x ${destinationPath}`);
    }
    console.log(`Success! Binary installed successfully in ${destinationPath}`);
  } catch (error) {
    console.error('Error installing binary:', error);
    process.exit(1);
  }
}

installBinary();