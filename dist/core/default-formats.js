
/*
Event code definitions.
@module core/default-formats
@license MIT. See LICENSE.md for details.
 */


/** Supported resume formats. */

(function() {
  module.exports = [
    {
      name: 'html',
      ext: 'html',
      gen: new (require('../generators/html-generator'))()
    }, {
      name: 'txt',
      ext: 'txt',
      gen: new (require('../generators/text-generator'))()
    }, {
      name: 'doc',
      ext: 'doc',
      fmt: 'xml',
      gen: new (require('../generators/word-generator'))()
    }, {
      name: 'pdf',
      ext: 'pdf',
      fmt: 'html',
      is: false,
      gen: new (require('../generators/html-pdf-cli-generator'))()
    }, {
      name: 'png',
      ext: 'png',
      fmt: 'html',
      is: false,
      gen: new (require('../generators/html-png-generator'))()
    }, {
      name: 'md',
      ext: 'md',
      fmt: 'txt',
      gen: new (require('../generators/markdown-generator'))()
    }, {
      name: 'json',
      ext: 'json',
      gen: new (require('../generators/json-generator'))()
    }, {
      name: 'yml',
      ext: 'yml',
      fmt: 'yml',
      gen: new (require('../generators/json-yaml-generator'))()
    }, {
      name: 'latex',
      ext: 'tex',
      fmt: 'latex',
      gen: new (require('../generators/latex-generator'))()
    }
  ];

}).call(this);

//# sourceMappingURL=default-formats.js.map
