/**
Internal resume generation logic for HackMyResume.
@license MIT. Copyright (c) 2015 James M. Devlin / FluentDesk.
@module hackmycmd.js
*/

(function() {
  module.exports = function () {

    var unused = require('./utils/string')
      , PATH = require('path');


    /**
    Display help documentation.
    */
    function help() {
      console.log( FS.readFileSync( PATH.join(__dirname, 'use.txt'), 'utf8' )
        .useful.bold );
    }

    /**
    Internal module interface. Used by FCV Desktop and HMR.
    */
    var v = {
      build: require('./verbs/generate'),
      validate: require('./verbs/validate'),
      convert: require('./verbs/convert'),
      new: require('./verbs/create'),
      help: help
    }

    return {
      verbs: v,
      alias: {
        generate: v.build,
        create: v.build
      },
      lib: require('./hackmyapi'),
      options: require('./core/default-options'),
      formats: require('./core/default-formats')
    };

  }();

}());

// [1]: JSON.parse throws SyntaxError on invalid JSON. See:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
