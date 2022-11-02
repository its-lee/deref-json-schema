import cliColors from 'cli-color';

const levels = [
  { name: 'error', colour: cliColors.redBright },
  { name: 'warn', colour: cliColors.yellow },
  { name: 'info', colour: cliColors.cyan },
  { name: 'debug', colour: cliColors.green }
].map((v, i) => ({ ...v, level: i }));

type Level = 'error' | 'warn' | 'info' | 'debug';

let maxLevel = 0;

export const getLogLevels = (): typeof levels => levels;

export const enableVerbose = (verbose: boolean): void => {
  const levelName = verbose ? 'debug' : 'info';
  maxLevel = levels.find(({ name }) => name === levelName)?.level || 0;
};

enableVerbose(false);

export const log = (level: Level, ...messages: unknown[]): void => {
  const levelInfo = levels.find(l => l.name === level);
  if ((levelInfo?.level || 0) > maxLevel) {
    return;
  }

  console.info(levelInfo?.colour(`${level}:`.padStart(6)), ...messages);
};
