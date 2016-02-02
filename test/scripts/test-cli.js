/**
CLI test routines for HackMyResume.
@module test-cli.js
*/



var chai = require('chai')
  , should = chai.should()
  , expect = chai.expect
  , HMRMAIN = require('../../dist/cli/main')
  , CHALK = require('chalk')
  , FS = require('fs')
  , PATH = require('path')
  , PKG = require('../../package.json')
  , STRIPCOLOR = require('stripcolorcodes')
  , _ = require('underscore')
  , EXEC = require('child_process').execSync



var gather = '';
var ConsoleLogOrg = console.log;
var ProcessExitOrg = process.exit;
var commandRetVal = 0;

// TODO: use sinon
// Replacement for process.exit()
function MyProcessExit( retVal ) {
  commandRetVal = retVal;
}

// TODO: use sinon
// Replacement for console.log
function MyConsoleLog() {
  var tx = Array.prototype.slice.call(arguments).join(' ');
  gather += STRIPCOLOR( tx );
  ConsoleLogOrg.apply(this, arguments);
}

describe('Testing CLI interface', function () {


  // Run a test through the stub, gathering console.log output into "gather"
  // and testing against it.
  function run( args, expErr ) {
    var title = args;
    it( 'Testing: "' + title + '"\n\n', function() {
      try {
        EXEC('hackmyresume ' + args);
        commandRetVal = 0;
      }
      catch(ex) {
        commandRetVal = ex.status;
      }
      commandRetVal.should.equal( parseInt(expErr, 10) );
    });
  }

  var lines = FS.readFileSync( PATH.join( __dirname, './test-hmr.txt'), 'utf8').split('\n');
  lines.forEach(function(l){
    if( l && l.trim() ) {
      if(l[0] !== '#') {
        var lineInfo = l.split('|');
        var errCode = lineInfo[0];
        run( lineInfo.length > 1 ? lineInfo[1] : '', errCode );
      }
    }
  });

  process.exit = ProcessExitOrg;

});
