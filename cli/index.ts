#!/usr/bin/env node

import { Command } from '../src/command';

const command = new Command(process.argv);
command
  .run(process.argv)
  .then(() => {})
  .catch(() => {
    process.exit(-1);
  })
  .finally(() => {
    process.exit(0);
  });
