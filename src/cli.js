import { sep } from 'path';

import { program } from 'commander';

import { setVerbosity } from './helpers/log.js';
import { derefJsonSchemas } from './index.js';

const defaultOptionsSuffix = '-deref';

const options = program
  .requiredOption('-i, --input <string>', 'the input directory containing JSON schema files')
  .option(
    '-o, --output <string>',
    `the output directory to write the deref'ed JSON schema files to - this direction will be completely overwritten. If not passed, appends '${defaultOptionsSuffix}' to the directory`
  )
  .option(
    '-p, --max-passes <number>',
    'the maximum number of passes to apply when replacing $refs',
    v => parseInt(v, 10),
    1000
  )
  .option('-vvv, --verbose', 'whether logging should be enabled during processing', false)
  .parse()
  .opts();

const handleOutputDefault = () => {
  if (options.output) {
    return options.output;
  }

  const inputParts = options.input.split(sep);
  return [...inputParts.slice(0, -1), inputParts.slice(-1)[0] + defaultOptionsSuffix].join(sep);
};

setVerbosity(options.verbose);
options.output = handleOutputDefault(options);
derefJsonSchemas(options);
