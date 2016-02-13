/**
Output test routines for HackMyResume. Make sure our outputs are consistent.
@module test-output.js
@license MIT. See LICENSE.md for details.
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
  , _ = require('underscore');



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


describe('Testing Ouput interface', function () {

  this.timeout(20000);

  // HackMyResume CLI stub. Handle a single HMR invocation.
  function HackMyResumeOutputStub( args ) {

    console.log = MyConsoleLog;
    process.exit = MyProcessExit;
    CHALK.enabled = false;

    try {
      args.unshift( process.argv[1] );
      args.unshift( process.argv[0] );
      HMRMAIN( args );
    }
    catch( ex ) {
      console.error(ex);
      require('../../dist/cli/error').err( ex, false );
    }
    CHALK.enabled = true;
    //process.exit = ProcessExitOrg;
    console.log = ConsoleLogOrg;

  }

  // Run a test through the stub, gathering console.log output into "gather"
  // and testing against it.
  function run( title, args, tests ) {
    it( title, function() {

      gather = '';
      HackMyResumeOutputStub( args );

      expect(
        _.all( tests, function(t) {
          return gather.indexOf(t) > -1;
        })
      ).to.equal(true);

    });
  }

  var title = '*** HackMyResume v' + PKG.version + ' ***';
  var feedMe = 'Please feed me a resume in FRESH or JSON Resume format.';
  var manPage = FS.readFileSync( PATH.resolve( __dirname, '../../src/cli/use.txt' ), 'utf8');

  run('HMR should output a help string when no command is specified',
      [], [ title, 'Please give me a command (BUILD, ANALYZE, VALIDATE, CONVERT, NEW, or PEEK).' ]);

  run('BUILD should output a tip when no source is specified',
      ['build'], [ title, feedMe ]);

  run('VALIDATE should output a tip when no source is specified',
     ['validate'], [ title, feedMe ]);

  run('ANALYZE should output a tip when no source is specified',
      ['analyze'], [ title, feedMe ]);

  run('BUILD should display an error on a broken resume',
     ['build',
      'node_modules/fresh-test-resumes/src/fresh/johnny-trouble.broken.json',
      '-t', 'modern'
    ], [ title, 'Error: Invalid or corrupt JSON on line'  ]);

  run('CONVERT should output a tip when no source is specified',
      ['convert'], [ title, feedMe ]);

  run('NEW should output a tip when no source is specified',
      ['new'], [ title, 'Please specify the filename of the resume to create.' ]);

  // This will cause the HELP doc to be emitted, followed by an "unknown option --help"
  // error in the log, based on the way we're calling into HMR. As long as the test
  // passes, any extraneous error messages can be ignored here.
  run('HMR should output help doc with --help',
      ['--help'], [ manPage ]);

  run('HMR should accept raw JSON via --options',
      [
        'build',
        'node_modules/fresh-test-resumes/src/fresh/jane-fullstacker.json',
        'to',
        'test/sandbox/temp/janeq-1.all',
        '-o',
        "{ theme: 'compact', debug: true, pdf: 'wkhtmltopdf' }"],
      [ 'Applying COMPACT theme (', '(with wkhtmltopdf)'] );

  run('HMR should accept a JSON settings file via --options',
      [
        'build',
        'node_modules/fresh-test-resumes/src/fresh/jane-fullstacker.json',
        'to',
        'test/sandbox/temp/janeq-2.all',
        '--options',
        "test/scripts/hmr-options.json"],
      [ 'Applying POSITIVE theme'] );

  run('Explicit command line options should override --options',
      [
        'build',
        'node_modules/fresh-test-resumes/src/fresh/jane-fullstacker.json',
        'to',
        'test/sandbox/temp/janeq-3.all',
        '--options',
        "test/hmr-options.json",
        "-t",
        "modern"
      ],
      [ 'Applying MODERN theme'] );
});
