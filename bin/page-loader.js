#!/usr/bin/env node

import { program } from 'commander';
import pageloader from '../src/index.js';

program
  .name('page-loader')
  .version('1.0.0')
  .description('Page loader utility')
  .command('open')
  .argument('<url>', 'https://ru.hexlet.io/courses')
  .option('-V, --version', 'output the version number')
  .option('-o, --output [dir]', 'output dir (default: "/home/user/current-dir")')
  .helpOption('--help')
  .action(() => {
    console.log('234'); // stub
    // console.log(pageloader(url));
  });

program.parse();
