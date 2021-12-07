/* eslint-disable no-console */
// import yargs from 'yargs';
// import { hideBin } from 'yargs/helpers';
// import log from 'loglevel';

import yargs from 'yargs';

export class Commamd {
  public async run(argv: string[]): Promise<void> {
    await yargs
      .scriptName('framework')
      .command({
        command: 'generate [moduleType] [moduleNames...]',
        aliases: ['g'],
        describe: 'Generates a resource',
        handler: (parsed) => console.log('your handler goes here', parsed),
        builder: {
          moduleType: {
            demand: true,
            choices: ['routed', 'stateful'] as const,
            default: 'routed',
          },
          moduleNames: {
            demand: true,
            array: true,
          },
        },
      })
      .help()
      .parse(argv);
  }
}
