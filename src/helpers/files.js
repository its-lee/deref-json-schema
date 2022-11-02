import {
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  rmSync
} from 'fs';
import { dirname, extname, resolve, relative } from 'path';

import { log } from './log.js';

const findFiles = (dir, files = []) => {
  readdirSync(dir).map(file => {
    const filepath = `${dir}/${file}`;
    if (statSync(filepath).isDirectory()) {
      findFiles(filepath, files);
    } else {
      files.push(filepath);
    }
  });

  return files;
};

export const findJsonFiles = filepath => {
  return findFiles(filepath).filter(f => extname(f) === '.json');
};

export const copyJsonFiles = (src, dest) => {
  ensureDirExistsSync(dest);
  rmSync(dest, { recursive: true, force: true });

  findJsonFiles(src).forEach(filepath => {
    const destFilepath = resolve(dest, relative(src, filepath));
    ensureDirExistsSync(destFilepath);
    copyFileSync(filepath, destFilepath);
  });
};

export const readJsonFileSync = filepath => {
  return JSON.parse(readFileSync(filepath));
};

export const ensureDirExistsSync = filepath => {
  const dir = dirname(filepath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

export const writeJsonFileSync = (filepath, obj) => {
  ensureDirExistsSync(filepath);
  writeFileSync(filepath, JSON.stringify(obj, null, 2), { flag: 'w' });
};

export const modifyJsonFiles = (filepaths, callback) => {
  filepaths.forEach(filepath => {
    const content = readJsonFileSync(filepath);
    callback(content, filepath);
    writeJsonFileSync(filepath, content);
  });
};

export const multipassModifyJsonFiles = (files, callback, maxPasses = 100) => {
  modifyJsonFiles(files, (content, filepath) => {
    log('debug', 'Modifying', filepath);
    for (let pass = 0; pass < maxPasses; pass++) {
      const changes = callback(content, filepath);
      log('debug', `[Pass #${pass + 1}]`, 'Made', changes, 'change(s)');
      if (!changes) {
        log('debug', 'No more changes to perform - done!');
        break;
      }
    }
  });
};
