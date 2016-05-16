/**
Test routines for HackMyResume hbs helpers
@module test-hbs-helpers.js
@license MIT. See LICENSE.md for details.
*/

var chai = require('chai')
  , expect = chai.expect
  , _ = require('lodash')
  , sh = require( '../../dist/helpers/string-helpers')

describe('stringHelpers', function() {
  it('alignLeft()', function() {
    var res = sh.alignLeft('xxx',10,'y');
    expect( res.length ).to.equal(10);
    expect( res ).to.equal('yyyyyyyxxx');
    res =  sh.alignLeft('xxx',5,' ');
    expect( res.length ).to.equal(5);
    expect( res ).to.equal('  xxx');
  });
  it('alignRight()', function() {
    expect( sh.alignRight('xxx',10,'y')).to.equal('xxxyyyyyyy');
    expect( sh.alignRight('xxx',5,' ')).to.equal('xxx  ');
  }),
  it('alignCenter()', function() {
    expect( sh.alignCenter('xxx',10,'y')).to.equal('yyyyxxxyyy');
    expect( sh.alignCenter('xxx',5,' ')).to.equal(' xxx ');
    expect( sh.alignCenter('xx',5,' ')).to.equal('  xx ');
    expect( sh.alignCenter('xx',6,' ')).to.equal('  xx  ');
  })
});
