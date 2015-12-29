(function(){

  var FLUENT = require('../hackmyapi');

  /**
  Supported resume formats.
  */
  module.exports = [
    { name: 'html', ext: 'html', gen: new FLUENT.HtmlGenerator() },
    { name: 'txt',  ext: 'txt', gen: new FLUENT.TextGenerator()  },
    { name: 'doc',  ext: 'doc',  fmt: 'xml', gen: new FLUENT.WordGenerator() },
    { name: 'pdf',  ext: 'pdf', fmt: 'html', is: false, gen: new FLUENT.HtmlPdfGenerator() },
    { name: 'png',  ext: 'png', fmt: 'html', is: false, gen: new FLUENT.HtmlPngGenerator() },
    { name: 'md', ext: 'md', fmt: 'txt', gen: new FLUENT.MarkdownGenerator() },
    { name: 'json', ext: 'json', gen: new FLUENT.JsonGenerator() },
    { name: 'yml', ext: 'yml', fmt: 'yml', gen: new FLUENT.JsonYamlGenerator() },
    { name: 'latex', ext: 'tex', fmt: 'latex', gen: new FLUENT.LaTeXGenerator() }

  ];

}());
