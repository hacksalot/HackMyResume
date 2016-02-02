/**
CLI test routines for HackMyResume.
@module test-cli.js
*/



var chai = require('chai')
  , should = chai.should()
  , expect = chai.expect
  , FS = require('fs')
  , PATH = require('path')
  , EXEC = require('child_process').exec


describe('Testing CLI interface', function () {

  this.timeout(5000);

  // Run a test through the stub, gathering console.log output into "gather"
  // and testing against it.
  function run( args, expErr ) {
    var title = args;
    it( 'Testing: "' + title + '"\n\n', function( done ) {
      try {
        EXEC('hackmyresume ' + args, null, function(err,stdo,stde) {
          var errCode = (err && err.code) || 0;
          errCode.should.equal( parseInt(expErr, 10) );
          done();
        });
      }
      catch(ex) {
        ex.status.should.equal( parseInt(expErr, 10) );
        done();
      }
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

});
