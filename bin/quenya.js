#!/usr/bin/env node
'use strict'
'use magic shebang https://github.com/eslint/espree/issues/136'
//! Simple CLI interface to Quenya, spits out JSON objects
//
// Takes a list of files or quoted globs, resolves the path, and prints out
// JSON objects to STDOUT, one per line. No further processing is done, and
// as with Quenya, order is not guaranteed.

const argv = require('minimist')(process.argv.slice(2), {
  alias: { help: 'h' }
})

if (argv._.length === 0 || argv.help) {
  console.error(
    'quenya: Rustdoc-inspired code documentation\n' +
    '\n' +
    'Usage:\n' +
    ' quenya [options] <files or quoted globs...>\n' +
    '\n' +
    'Options:\n' +
    '  -h, --help             display this help and exit\n'
  )
  return process.exit()
}

const glob = require('glob-promise')
const map = require('through2-map').obj
const path = require('path')

Promise.all(argv._.map(pattern => glob(pattern)))
.then(lists => lists.reduce((memo, list) => {
  [].push.apply(memo, list)
  return memo
}, []))
.catch(err => void console.error('Globbing error:', err))
.then(files => files.map(file => path.resolve(process.cwd(), file)))
.then(files => require('..')({
  files: files
}).pipe(map(doc => {
  console.log(JSON.stringify(doc))
})))
