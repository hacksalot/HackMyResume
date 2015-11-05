/**
Core resume generation module for FluentCV.
@license Copyright (c) 2015 by James M. Devlin. All rights reserved.
*/

module.exports = {
  Sheet: require('./core/sheet'),
  Theme: require('./core/theme'),
  FluentDate: require('./core/fluent-date'),
  HtmlGenerator: require('./gen/html-generator'),
  TextGenerator: require('./gen/text-generator'),
  HtmlPdfGenerator: require('./gen/html-pdf-generator'),
  WordGenerator: require('./gen/word-generator'),
  MarkdownGenerator: require('./gen/markdown-generator'),
  JsonGenerator: require('./gen/json-generator'),
  YamlGenerator: require('./gen/yaml-generator'),
  JsonYamlGenerator: require('./gen/json-yaml-generator')
};
