var chai = require('chai')
  , expect = chai.expect
  , HMRMAIN = require('../src/main')
  , CHALK = require('chalk')
  , _ = require('underscore');

// Disable colors for easier output testing
CHALK.enabled = false;

describe('Testing Ouput interface', function () {

  var gather = '';
  var ConsoleLogOrg = console.log;

  function MyConsoleLog( msg ) {
    gather += msg;
    ConsoleLogOrg.apply(this, arguments);
  }

  function HackMyResumeStub( args ) {

    try {
      args.unshift( process.argv[1] );
      args.unshift( process.argv[0] );
      var HMRMAIN = require('../src/main');
      HMRMAIN( args );
    }
    catch( ex ) {
      require('../src/core/error-handler').err( ex, false );
    }
  }

  function run( title, args, tests ) {
    it( title, function() {
      gather = '';
      console.log = MyConsoleLog;
      HackMyResumeStub( args );
      console.log = ConsoleLogOrg;
      expect(
        _.all( tests, function(t) {
          return gather.indexOf(t) > -1;
        })
      ).to.equal(true);
    });
  }

  var title = '*** HackMyResume v1.5.2 ***';
  var feedMe = 'Please feed me a resume in FRESH or JSON Resume format.';

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


});
