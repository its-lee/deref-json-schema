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

import { log } from './log';

const findFiles = (dir: string, files: string[] = []): string[] => {
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

export const findJsonFiles = (filepath: string): string[] => {
  return findFiles(filepath).filter(f => extname(f) === '.json');
};

export const copyJsonFiles = (src: string, dest: string): void => {
  ensureDirExistsSync(dest);
  rmSync(dest, { recursive: true, force: true });

  findJsonFiles(src).forEach(filepath => {
    const destFilepath = resolve(dest, relative(src, filepath));
    ensureDirExistsSync(destFilepath);
    copyFileSync(filepath, destFilepath);
  });
};

export const readJsonFileSync = (filepath: string): unknown => {
  return JSON.parse(readFileSync(filepath) as unknown as string);
};

export const ensureDirExistsSync = (filepath: string): void => {
  const dir = dirname(filepath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

export const writeJsonFileSync = (filepath: string, obj: unknown): void => {
  ensureDirExistsSync(filepath);
  writeFileSync(filepath, JSON.stringify(obj, null, 2), { flag: 'w' });
};

export const modifyJsonFiles = (
  filepaths: string[],
  callback: (content: unknown, filepath: string) => unknown
): void => {
  filepaths.forEach(filepath => {
    const content = readJsonFileSync(filepath);
    callback(content, filepath);
    writeJsonFileSync(filepath, content);
  });
};

export const multipassModifyJsonFiles = (
  files: string[],
  callback: (content: unknown, filepath: string) => number,
  maxPasses = 100
): void => {
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
