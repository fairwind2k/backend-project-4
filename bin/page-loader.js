#!/usr/bin/env node

import { program } from 'commander';
import pageloader from '../src/index.js';

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .helpOption('-h --help', 'display help for command')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  // .option('-o, --output [dir]', 'output dir', '/home/user/current-dir')
  .arguments('<url>')
  .action((url) => {
    const options = program.opts();
    const outputPath = pageloader(url, options.output);
    console.log(outputPath);
    // console.log('234'); // stub
    // console.log(pageloader('https://ru.hexlet.io'));
  });

program.parse(process.argv);
