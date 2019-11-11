#!/usr/bin/env node

const program = require('commander')
const pkg = require('../package')
const vscPatch = require('..')

program
  .version(pkg.version)
  .option('-D, --dir <dir>', 'VSCode root dir')
  .parse(process.argv)

const { dir } = program

vscPatch({ dir })
