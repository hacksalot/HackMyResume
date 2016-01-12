var chai = require('chai')
  , expect = chai.expect
  , HMRMAIN = require('../src/cli/main')
  , CHALK = require('chalk')
  , FS = require('fs')
  , PATH = require('path')
  , PKG = require('../package.json')
  , _ = require('underscore');

var gather = '';
var ConsoleLogOrg = console.log;
var ProcessExitOrg = process.exit;

describe('Testing Ouput interface', function () {



  function MyConsoleLog( msg ) {
    gather += msg;
    ConsoleLogOrg.apply(this, arguments);
  }

  function MyProcessExit() {

  }

  function HackMyResumeStub( args ) {

    console.log = MyConsoleLog;
    process.exit = MyProcessExit;
    CHALK.enabled = false;

    try {
      args.unshift( process.argv[1] );
      args.unshift( process.argv[0] );
      var HMRMAIN = require('../src/cli/main');
      HMRMAIN( args );
    }
    catch( ex ) {
      require('../src/core/error-handler').err( ex, false );
    }
    CHALK.enabled = true;
    process.exit = ProcessExitOrg;
    console.log = ConsoleLogOrg;

  }

  function run( title, args, tests ) {
    it( title, function() {

      gather = '';
      HackMyResumeStub( args );

      expect(
        _.all( tests, function(t) {
          return gather.indexOf(t) > -1;
        })
      ).to.equal(true);

    });
  }

  var title = '*** HackMyResume v' + PKG.version + ' ***';
  var feedMe = 'Please feed me a resume in FRESH or JSON Resume format.';
  var manPage = FS.readFileSync( PATH.resolve( __dirname, '../src/cli/use.txt' ), 'utf8');

  run('HMR should output a help string when no command is specified',
      [], [ title, 'Please give me a command (BUILD, ANALYZE, VALIDATE, CONVERT, or NEW).' ]);

  run('BUILD should output a tip when no source is specified',
      ['build'], [ title, feedMe ]);

  run('VALIATE should output a tip when no source is specified',
     ['validate'], [ title, feedMe ]);

  run('ANALYZE should output a tip when no source is specified',
      ['analyze'], [ title, feedMe ]);

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
        'node_modules/fresh-test-resumes/src/jane-fullstacker.fresh.json',
        '-o',
        "{ theme: 'compact', debug: true, pdf: 'wkhtmltopdf' }"],
      [ 'Applying COMPACT theme', '(with wkhtmltopdf)'] );

  run('HMR should accept a JSON settings file via --options',
      [
        'build',
        'node_modules/fresh-test-resumes/src/jane-fullstacker.fresh.json',
        '--options',
        "test/hmr-options.json"],
      [ 'Applying POSITIVE theme'] );
});
