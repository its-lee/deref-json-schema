import { resolve, dirname } from 'path';

import { log } from './helpers/log.js';
import {
  findJsonFiles,
  copyJsonFiles,
  readJsonFileSync,
  modifyJsonFiles,
  multipassModifyJsonFiles
} from './helpers/files.js';
import { resolveKeypath } from './helpers/utility.js';
import { visitInterfileRefs, visitIntrafileRefs } from './helpers/visitors.js';

const buildRef = parts => parts.filter(Boolean).join('#');

const throwInvalidRefError = (refParts, filepath, e) => {
  throw new Error(`Invalid $ref '${buildRef(refParts)}' when reading '${filepath}'`, e);
};

export const derefIntrafileRefs = (files, maxPasses) => {
  multipassModifyJsonFiles(
    files,
    (content, filepath) => {
      let derefs = 0;

      visitIntrafileRefs(content, refKeypath => {
        derefs++;
        try {
          return resolveKeypath(content, refKeypath);
        } catch (e) {
          throwInvalidRefError([refKeypath], filepath, e);
        }
      });

      return derefs;
    },
    maxPasses
  );
};

export const absolutifyInterfileRefs = files => {
  modifyJsonFiles(files, (content, filepath) => {
    visitInterfileRefs(content, (refFilepath, refKeypath) => {
      const absoluteRefFilepath = resolve(dirname(filepath), refFilepath);
      return {
        $ref: buildRef([absoluteRefFilepath, refKeypath])
      };
    });
  });
};

export const derefInterfileRefs = (files, maxPasses) => {
  multipassModifyJsonFiles(
    files,
    (content, filepath) => {
      let derefs = 0;

      visitInterfileRefs(content, (refFilepath, refKeypath) => {
        derefs++;
        const refContent = readJsonFileSync(refFilepath);

        try {
          // An empty keypath can occur here for something like { "$ref": ""../../standards/openapi.v3.json"" }
          // which is fine (that's just the whole file) - so just mapping that to "" will correctly return the
          // whole file content.
          return resolveKeypath(refContent, refKeypath || '');
        } catch (e) {
          throwInvalidRefError([refFilepath, refKeypath], filepath, e);
        }
      });

      return derefs;
    },
    maxPasses
  );
};

export const derefJsonSchemas = ({ input, output, maxPasses }) => {
  try {
    log(
      'info',
      `Copying schemas to output directory ${output} - this will delete the content of the output direction first`
    );
    copyJsonFiles(input, output);

    const files = findJsonFiles(output);

    log('info', 'Dereferencing intra-file $refs (as these could contain inter-file $refs)');
    derefIntrafileRefs(files, maxPasses);

    log('info', 'Converting inter-file $refs to become absolute');
    absolutifyInterfileRefs(files);

    log('info', 'Dereferencing inter-file $refs');
    derefInterfileRefs(files, maxPasses);

    log('info', 'Complete, output is located at', output);
  } catch (e) {
    log('error', e);
  }
};
