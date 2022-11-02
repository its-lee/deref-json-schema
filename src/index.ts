import { resolve, dirname } from 'path';

import { log } from './helpers/log';
import {
  findJsonFiles,
  copyJsonFiles,
  readJsonFileSync,
  modifyJsonFiles,
  multipassModifyJsonFiles
} from './helpers/files';
import { resolveKeypath } from './helpers/utility';
import { visitInterfileRefs, visitIntrafileRefs, VisitorCallback } from './helpers/visitors';
import { DerefOptions } from './types';

const buildRef = (parts: string[]): string => parts.filter(Boolean).join('#');

const throwInvalidRefError = (refParts: string[], filepath: string, e: unknown): never => {
  throw new Error(`Invalid $ref '${buildRef(refParts)}' when reading '${filepath}': ${e}`);
};

export const derefIntrafileRefs = (files: string[], maxPasses: number): void => {
  multipassModifyJsonFiles(
    files,
    (content, filepath) => {
      let derefs = 0;

      visitIntrafileRefs(
        content as Record<string, unknown>,
        (refKeypath: string): ReturnType<VisitorCallback> => {
          derefs++;
          try {
            return resolveKeypath(
              content as Record<string, unknown>,
              refKeypath
            ) as ReturnType<VisitorCallback>;
          } catch (e) {
            throwInvalidRefError([refKeypath], filepath, e);
          }
        }
      );

      return derefs;
    },
    maxPasses
  );
};

export const absolutifyInterfileRefs = (files: string[]): void => {
  modifyJsonFiles(files, (content, filepath) => {
    visitInterfileRefs(content as Record<string, unknown>, (refFilepath, refKeypath) => {
      const absoluteRefFilepath = resolve(dirname(filepath), refFilepath);
      return {
        $ref: buildRef([absoluteRefFilepath, refKeypath])
      };
    });
  });
};

export const derefInterfileRefs = (files: string[], maxPasses: number): void => {
  multipassModifyJsonFiles(
    files,
    (content, filepath) => {
      let derefs = 0;

      visitInterfileRefs(
        content as Record<string, unknown>,
        (refFilepath: string, refKeypath: string): ReturnType<VisitorCallback> => {
          derefs++;
          const refContent = readJsonFileSync(refFilepath);

          try {
            // An empty keypath can occur here for something like { "$ref": ""../../standards/openapi.v3.json"" }
            // which is fine (that's just the whole file) - so just mapping that to "" will correctly return the
            // whole file content.
            return resolveKeypath(
              refContent as Record<string, unknown>,
              refKeypath || ''
            ) as ReturnType<VisitorCallback>;
          } catch (e) {
            throwInvalidRefError([refFilepath, refKeypath], filepath, e);
          }
        }
      );

      return derefs;
    },
    maxPasses
  );
};

export const derefJsonSchemas = ({ input, output, maxPasses }: DerefOptions) => {
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
