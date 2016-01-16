/**
Message-handling routines for HackMyResume.
@module msg.js
@license MIT. See LICENSE.md for details.
*/



(function() {

  var PATH = require('path');
  var YAML = require('yamljs');

  var cache = module.exports = function() {
    return cache ? cache : YAML.load( PATH.join(__dirname, 'msg.yml') );
  }();

}());
