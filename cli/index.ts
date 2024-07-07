#!/usr/bin/env node

(async () => {
  process.emitWarning = () => {};

  const { ErrorWithReturnCode } = await import('../src/errors');
  const { Command } = await import('../src/command');
  const { Console } = await import('console');
  const { isHeadless } = await import('../src/ui');

  const customConsole = new Console(isHeadless() ? process.stderr : process.stdout, process.stderr);

  console.log = customConsole.log;
  console.info = customConsole.info;
  console.warn = customConsole.warn;
  console.error = customConsole.error;
  console.debug = customConsole.debug;
  console.clear = customConsole.clear;
  console.trace = customConsole.trace;

  const command = new Command(process.argv);
  try {
    await command.run(process.argv);
    process.exit(0);
  } catch (e) {
    if (e instanceof ErrorWithReturnCode) {
      process.exit(e.returnCode);
    }
    process.exit(-1);
  }
})();
