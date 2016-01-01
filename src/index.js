#! /usr/bin/env node

/**
Command-line interface (CLI) for HackMyResume.
@license MIT. Copyright (c) 2015 hacksalot (https://github.com/hacksalot)
@module index.js
*/



var SPAWNW = require('./core/spawn-watch')
  , ARGS = require( 'minimist' )
  , FCMD  = require( './hackmycmd')
  , PKG = require('../package.json')
  , FS = require('fs')
  , chalk = require('chalk')
  , PATH = require('path')
  , HACKMYSTATUS = require('./core/status-codes')
  , opts = { }
  , title = chalk.white('\n*** HackMyResume v' + PKG.version + ' ***')
  , _ = require('underscore');




try {
  main();
}
catch( ex ) {
  require('./core/error-handler').err( ex, true );
}



function main() {

  // Colorize
  // COLORS.setTheme({
  //   title: ['white','bold'],
  //   info: process.platform === 'win32' ? 'gray' : ['white','dim'],
  //   infoBold: ['white','dim'],
  //   warn: 'yellow',
  //   error: 'red',
  //   guide: 'yellow',
  //   status: 'gray',//['white','dim'],
  //   useful: 'green',
  // });

  // Setup
  if( process.argv.length <= 2 ) { throw { fluenterror: 4 }; }
  var a = ARGS( process.argv.slice(2) );
  opts = getOpts( a );
  logMsg( title );

  // Get the action to be performed
  var params = a._.map( function(p){ return p.toLowerCase().trim(); });
  var verb = params[0];
  if( !FCMD.verbs[ verb ] && !FCMD.alias[ verb ] ) {
    logMsg(chalk.yellow('Invalid command: "') + chalk.yellow.bold(verb) + chalk.yellow('"'));
    return;
  }

  // Find the TO keyword, if any
  var splitAt = _.indexOf( params, 'to' );
  if( splitAt === a._.length - 1 ) {
    // 'TO' cannot be the last argument
    logMsg('Please '.warn + 'specify an output file'.warn.bold +
      ' for this operation or '.warn + 'omit the TO keyword'.warn.bold +
      '.'.warn );
    return;
  }

  // Massage inputs and outputs
  var src = a._.slice(1, splitAt === -1 ? undefined : splitAt );
  var dst = splitAt === -1 ? [] : a._.slice( splitAt + 1 );
  ( splitAt === -1 ) && (src.length > 1) && (verb !== 'validate') && dst.push( src.pop() ); // Allow omitting TO keyword

  // Invoke the action
  (FCMD.verbs[verb] || FCMD.alias[verb]).apply(null, [src, dst, opts, logMsg]);

}

function logMsg( msg ) {
  opts.silent || console.log( msg );
}

function getOpts( args ) {
  var noPretty = args.nopretty || args.n;
  noPretty = noPretty && (noPretty === true || noPretty === 'true');
  return {
    theme: args.t || 'modern',
    format: args.f || 'FRESH',
    prettify: !noPretty,
    silent: args.s || args.silent,
    css: args.css || 'embed'
  };
}
