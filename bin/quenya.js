#!/usr/bin/env node
'use strict'
'use magic shebang https://github.com/eslint/espree/issues/136'
//! Simple CLI interface to Quenya, spits out JSON objects
//
// Takes a list of files or quoted globs, resolves the path, and prints out
// JSON objects to STDOUT, one per line. No further processing is done, and
// as with Quenya, order is not guaranteed.

const argv = process.argv.slice(2)
if (argv.length === 0) {
  console.error('Usage: quenya [options] <files or quoted globs...>')
  process.exit()
}

function glob (pattern) {
  return new Promise((resolve, reject) => {
    require('glob')(pattern, (err, files) => {
      if (err) {
        reject(err)
      } else {
        resolve(files)
      }
    })
  })
}

Promise.all(argv.map(pattern => glob(pattern)))
.then(lists => lists.reduce((memo, list) => {
  [].push.apply(memo, list)
  return memo
}, []))
.catch(err => void console.error('Globbing error:', err))
.then(files => files.map(file => require('path').resolve(process.cwd(), file)))
.then(files => require('..')({
  files: files
}).on('data', doc => void console.log(JSON.stringify(doc))))
