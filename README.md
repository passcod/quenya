# Quenya

_Rustdoc-inspired code documentation._

## Examples

In JavaScript, from Quenya's (original) source:

```js
//! Extracts doc comments from a stream of lines
//
// This is a simple state machine that is fed a file line by line, and
// spits out unparsed and unprocessed blocks of doc comments.
class Extractor {
  constructor (docStream, path) {
    // ...
  }
}
```

In Ruby:

```ruby

#! The main instance of the Caskbot
Caskbot.bot = Cinch::Bot.new do
  configure do |c|
    # ...
  end
end
```

In Bash:

```bash
#!/usr/bin/bash

#! The URL to Apple's list of Aerial screensaver videos
#
# I wonder if there's Spring resources...
url='http://a1.phobos.apple.com/us/r1000/000/Features/atv/AutumnResources/...'

http $url \
  | jq -r '.[].assets[].url' \
  > .aria.urls
```

And others!

## Usage

Quenya is itself a low-level tool only, parsing source files and outputting
objects representing each comment, like:

```json
{
  "body": "This is a simple state machine that is fed a file line by line, and\nspits out unparsed and unprocessed blocks of doc comments.",
  "context": "class Extractor {",
  "contextLine": 69,
  "lineNumber": 65,
  "path": "/home/code/js/quenya/index.js",
  "title": "Extracts doc comments from a stream of lines"
}
```

This corresponds to the following source snippet (the first line was line 65 in
the original file):

```js
//! Extracts doc comments from a stream of lines
//
// This is a simple state machine that is fed a file line by line, and
// spits out unparsed and unprocessed blocks of doc comments.
class Extractor {
```

While Quenya can be used solely as a commenting format, you'll most likely
want to extract documentation into something more usable. This can be done with
tools that consumes Quenya output. Such tooling could simply render the above,
or it could be aware of what syntax your source is using and use that to
perform more advanced rendering.

### Tooling

If you know of, or have developed, a tool that consumes or complements Quenya,
do open a Pull Request or even just an Issue on GitHub to add it here.

#### Quenya cli tool

The `quenya` executable, which ships with this package. Give it a list of files
or quoted globs to get a stream of JSON objects over STDOUT.

```
$ npm install -g quenya
$ quenya file.js '*.rb' '/some/path/**/*.sh'
```

### API

Quenya's API takes an array of absolute paths to files and returns a Stream of objects (as shown above, and explained below):

```js
const quenya = require('quenya')
quenya({
  files: [...]
}).on('data', function (doc) {
  console.log(doc)
  // ...
})
```

### Doc object semantics

```
//! First line is the `title`
//
// Everything else after that is the `body`. By convention, a blank line is
// left after the title. Also by convention, lines are hard-wrapped to 80 chars
// except for code and other justifiably long lines.
//
// ```
// code block are assumed to be the host (source file's) language
// ```
//
// ```python
// unless specified
// ```
//
// - Other
// - markdown
//
// > is totally cool.
var context = 'is the first line of code after the comment block'
```

- The `context` can be `null` if the actual line was blank or non-existent (EOF)
- The `lineNumber` refers to the 1-indexed first line of the doc comment
- The `contextLine` is the 1-indexed line number of the `context`
- The `path` is the absolute path to the file
- All string values are trimmed (whitespace removed from both sides)

## Forms

Quenya looks for comments on their own lines (they must only be preceded by
whitespace or nothing) in eight forms. The two Rust styles are supported,
although without the distinct semantics they possess in Rust. Many JavaScript
style lints do not allow the full `///` nor `//!` forms, but do allow the
"header" forms. Finally, the `#`-based forms allow Quenya to support Ruby,
Bash, some configuration formats, and other such languages that do not have
double-slash comments. For all forms, the space between the comment prefix and
the comment text is _mandatory_ except if the comment line is empty.

```
/// Classic rustdoc form
///
/// with three slashes
/// all the way

//! Classic bang rustdoc form
//!
//! with two slashes and a bang
//! all the way

/// Header form
//
// with three slashes on the first line
// and two slashes from then on

//! Bang header form
//
// with two slashes and a bang on the first line
// and two slashes from then on
// (this is the "default" form, used in Quenya's own documentation)

## Full hash form
##
## with two hash signs
## all the way

## Header hash form
#
# with two hash signs on the first line
# and one hash sign from then on

#! Full hash bang form
#!
#! with one hash sign followed by a bang
#! all the way

#! Header hash bang form
#
# with one hash sign and a bang on the first line
# and one hash sign from then on
```

These last two forms cannot be used on the first line of a file, as they would
be parsed as [shebangs]. This is not usually a problem, but is worth keeping in
mind.

[shebangs]: https://en.wikipedia.org/wiki/Shebang_%28Unix%29

## About

### Name

The name is that of the script used for some artificial languages in Tolkien's
legendarium (Lord of the Rings, etc). It is pronounced `[ˈkwɛnja]`, or Kw-en-ya
for those who can't read [IPA], not Ken-ya nor Keen-ya.

[IPA]: https://en.wikipedia.org/wiki/Help:IPA

### Motivation

The motivation is to create a simple documentation format that can be parsed
out from a variety of contexts and languages, without needing special awareness
and support for the particular source syntax from the documentation tool.

More precisely, at the time of Quenya's creation I was wrangling a codebase
written in JavaScript, augmented with various Babel plugins, including Flowtype
annotations. While trying to add documentation, it turned out that none of the
tools available supported _both_ multi-file projects and Babel.

### Inspiration

This is pretty obvious.

[Rust] has first-class documentation support. Its `///` and `//!` syntaxes
actually simply desugar to `#[doc("...")]` compiler annotations, which makes
the entire system feel and behave seamlessly.

At the same time, [the documentation itself][rustdoc] is simplicity incarnate.
Markdown text. The first line is the title. Conventions around sections for
commonly documented things, like examples. Code blocks assumed to be Rust
unless specified. It's simple to write, simple to read, simple to render.

[Rust]: https://rust-lang.org
[rustdoc]: https://doc.rust-lang.org/book/documentation.html

### License

Quenya is licensed under the ISC License. The full text follows and is also
available in the LICENSE file or at [SPDX][spdx-isc] or the [OSI][osi-isc].

> Copyright © 2016, Félix Saparelli <me @ passcod . name>
>
> Permission to use, copy, modify, and/or distribute this software for any
> purpose with or without fee is hereby granted, provided that the above
> copyright notice and this permission notice appear in all copies.
>
> THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
> REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
> AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
> INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
> LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
> OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
> PERFORMANCE OF THIS SOFTWARE.

[spdx-isc]: https://spdx.org/licenses/ISC.html
[osi-isc]: http://opensource.org/licenses/ISC
