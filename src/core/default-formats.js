(function(){

  /**
  Supported resume formats.
  */

  module.exports = [

    { name: 'html', ext: 'html', gen: new (require('../gen/html-generator'))() },
    { name: 'txt',  ext: 'txt', gen: new (require('../gen/text-generator'))()  },
    { name: 'doc',  ext: 'doc',  fmt: 'xml', gen: new (require('../gen/word-generator'))() },
    { name: 'pdf',  ext: 'pdf', fmt: 'html', is: false, gen: new (require('../gen/html-pdf-generator'))() },
    { name: 'png',  ext: 'png', fmt: 'html', is: false, gen: new (require('../gen/html-png-generator'))() },
    { name: 'md', ext: 'md', fmt: 'txt', gen: new (require('../gen/markdown-generator'))() },
    { name: 'json', ext: 'json', gen: new (require('../gen/json-generator'))() },
    { name: 'yml', ext: 'yml', fmt: 'yml', gen: new (require('../gen/json-yaml-generator'))() },
    { name: 'latex', ext: 'tex', fmt: 'latex', gen: new (require('../gen/latex-generator'))() }

  ];

}());
