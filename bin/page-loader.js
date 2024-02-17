#!/usr/bin/env node

import { program } from 'commander';
import pageloader from '../src/index.js';

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .helpOption('-h --help')
  .option('-o, --output [dir]', 'output dir', '/home/user/current-dir')
  .arguments('<url>', 'https://ru.hexlet.io/courses')
  .action(() => {
    console.log('234'); // stub
    console.log(pageloader('https://ru.hexlet.io'));
  });

program.parse();
