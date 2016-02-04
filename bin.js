#!/usr/bin/env node
'use strict'

const argv = require('minimist')(process.argv.slice(2), {
  alias: {
    help: 'h'
  },
  default: {}
})

const c = require('chalk')
const glob = require('glob-promise')
const pkg = require('./package.json')

//! Displays the help message
function help () {
  console.error(`
${pkg.name}: ${pkg.description}

Usage:
 ${pkg.name} [options] <files or quoted globs...>

Options:
  -h, --help             display this help and exit
  `.trim())
}

if (argv._.length === 0 || argv.help) {
  help()
  process.exit()
}

Promise.all(argv._.map(pattern => glob(pattern)))
.then(lists => lists.reduce((memo, list) => {
  [].push.apply(memo, list)
  return memo
}, []))
.catch(err => void console.error('Globbing error:', err))
.then(files => require('.')({
  files: files,
  errorHandler: err => void console.error(c.red(err))
}))

