'use strict'
//! Quenya
//
// Reads and parses files using Rustdoc-inspired comments

const fs = require('fs')
const map = require('through2-map').obj
const Readable = require('stream').Readable

const COMMENT = /^\s*(\/\/(\/|!)?|#(#|!)?)/
const DOC_COMMENT = /^\s*(\/\/(\/|!)|#(#|!))/

module.exports = function (opts) {
  opts = Object.assign({
    files: []
  }, opts)

  // Eliminate duplicate paths
  opts.files = opts.files.reduce((memo, file) => {
    if (memo.indexOf(file) === -1) {
      memo.push(file)
    }

    return memo
  }, [])

  const docStream = new Readable({ objectMode: true, read: () => {} })

  opts.files.map(file => {
    const extractor = new Extractor(docStream, file)
    fs.createReadStream(file)
    .on('error', err => void docStream.emit('error', err))
    .on('end', () => void extractor.send())
    .pipe(require('split')())
    .on('data', extractor.parse)
  })

  return consume(docStream)
}

//! Extracts the text out of a raw comment line
function rawLineToText (line) {
  const cut = line.indexOf(' ')
  return cut === -1
    ? ''
    : line.slice(cut + 1).trim()
}

//! Transforms doc comments in the stream to the output format
function consume (docStream) {
  return docStream
  .pipe(map(obj => {
    // Order is important here as we're mutating the array
    obj.contextLine = obj.lineNumber + obj.lines.length - 1
    obj.title = rawLineToText(obj.lines.shift())

    // Context must be null if non-existent or blank or all-whitespace
    obj.context = obj.lines.pop()
    obj.context = obj.context ? obj.context.trim() : obj.context
    obj.context = obj.context || null

    obj.body = obj.lines.map(rawLineToText).join('\n').trim()
    delete obj.lines
    return obj
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
      if (this.current === false) {
        // First line of doc comment.
        this.lineNumber = this.line
        this.current = [line]
      } else {
        // Other line of "full form" doc comment
        this.current.push(line)
      }
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
