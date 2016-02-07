'use strict'
//! Quenya
//
// Reads and parses files using Rustdoc-inspired comments

const fs = require('fs')
const Readable = require('stream').Readable
const Transform = require('stream').Transform

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
    .pipe(new Splitter(extractor))
  })

  return docStream
}

//! Splits the input (text) stream into lines and feeds them to the Extractor
//
// This is technically *not* a Transform, as it consumes the stream without
// generating anything back, but the mechanism of flush is perfect for this.
class Splitter extends Transform {
  constructor (extractor) {
    super()
    this.current = ''
    this.extractor = extractor
  }

  extract (line) {
    this.extractor.parse(line)
  }

  _transform (chunk, encoding, next) {
    if (encoding === 'buffer') {
      chunk = chunk.toString()
    }

    chunk = this.current + chunk
    const lines = chunk.split(/\r?\n/)
    this.current = lines.pop()

    lines.forEach(line => {
      this.extract(encoding === 'buffer' ? new Buffer(line) : line)
    })

    next()
  }

  _flush (done) {
    this.extract(this.current)
    done()
  }
}

//! Extracts the text out of a raw comment line
function rawLineToText (line) {
  const cut = line.indexOf(' ')
  return cut === -1
    ? ''
    : line.slice(cut + 1).trim()
}

//! Extracts doc comments from a stream of lines
//
// This is a simple state machine that is fed a file line by line, parses
// each line, constructs a doc comment object, and sends it off to the stream.
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

  //! Sends the current state to the stream and resets
  send () {
    if (this.current === false) { return }
    this.docStream.push(this.format())
    this.current = false
  }

  //! Transforms the current state to the output format
  format () {
    // If the last line is a comment, add a null context
    if (this.current[this.current.length - 1].match(COMMENT)) {
      this.current.push(null)
    }

    const obj = {
      path: this.path,
      lineNumber: this.lineNumber,

      // Order is important here as we're mutating the array
      contextLine: this.lineNumber + this.current.length - 1,
      title: rawLineToText(this.current.shift()),
      context: this.current.pop(),
      body: this.current.map(rawLineToText).join('\n').trim()
    }

    // Context must be null if non-existent or blank or all-whitespace
    obj.context = obj.context ? obj.context.trim() || null : null
    return obj
  }

  //! The line-by-line state machine
  parse (line) {
    line = line.toString().trim()
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
