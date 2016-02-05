'use strict'
//! Quenya
//
// Reads and parses files using Rustdoc-inspired comments

const fs = require('fs')
const map = require('through2-map').obj
const path = require('path')
const Readable = require('stream').Readable

const COMMENT = /^\s*(\/\/|#)/
const DOC_COMMENT = /^\s*(\/\/|#)!/

module.exports = function (opts) {
  opts = Object.assign({
    files: [],
    errorHandler: err => { throw err }
  }, opts)

  // Resolve all paths and eliminate duplicates
  opts.files = opts.files.reduce((memo, file) => {
    const filepath = path.resolve(process.cwd(), file)
    if (memo.indexOf(filepath) === -1) {
      memo.push(filepath)
    }

    return memo
  }, [])

  const docStream = new Readable({ objectMode: true })
  docStream._read = () => {}

  return Promise.all(opts.files.map(file => new Promise((resolve, reject) => {
    const extractor = new Extractor(docStream, file)
    fs.createReadStream(file)
    .on('error', err => { opts.errorHandler(err); resolve() })
    .on('end', () => { extractor.send(); resolve() })
    .pipe(require('split')())
    .on('data', extractor.parse)
  })))
  .then(() => {
    consume(docStream)
  })
  .catch(err => void console.error(err))
}

//! Consumes the doc comment stream
function consume (docStream) {
  docStream
  .pipe(map(obj => {
    obj.contextLine = obj.lineNumber + obj.lines.length - 1
    obj.title = obj.lines.shift().replace(DOC_COMMENT, '').trim()
    obj.context = obj.lines.pop()
    obj.body = obj.lines.map(
      line => line.replace(COMMENT, '').trim()
    ).join('\n').trim()
    delete obj.lines
    return obj
  }))
  .pipe(map(obj => {
    console.log(obj)
  }))
}

//! Extracts doc comments from a stream of lines
//
// This is a simple state machine that is fed a file line by line, and
// spits out unparsed and unprocessed blocks of doc comments.
class Extractor {
  constructor (docStream, path) {
    this.current = false
    this.docStream = docStream
    this.line = 0
    this.lineNumber = 0
    this.path = path

    this.parse = this.parse.bind(this)
    this.send = this.send.bind(this)
  }

  send () {
    if (this.current === false) { return }
    this.docStream.push({
      lineNumber: this.lineNumber,
      lines: this.current,
      path: this.path
    })
    this.current = false
  }

  parse (line) {
    line = line.trim()
    this.line += 1

    if (line.match(DOC_COMMENT)) {
      // First line of doc comment.

      if (this.current !== false) {
        // We're still extracting a doc comment, so send it and reset.
        this.send()
      }

      this.lineNumber = this.line
      this.current = [line]
    } else if (line.match(COMMENT)) {
      // Either normal comments or the rest of a doc comment.

      if (this.current !== false) {
        // It's a doc comment!
        this.current.push(line)
      }
    } else {
      // Not a doc comment line.

      if (this.current !== false) {
        // We're finishing up a doc comment, so just include
        // the line below the doc comment for context and send.
        this.current.push(line)
        this.send()
      }
    }
  }
}
