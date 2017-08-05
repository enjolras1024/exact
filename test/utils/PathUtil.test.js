describe('utils/PathUtil', function() {

  describe('PathUtil.parse', function() {
    it('parse path from string', function() {
      var parse = Exact.PathUtil.parse;
      chai.expect(parse('')).to.equal(null);
      chai.expect(parse('prop')).to.deep.equal(['prop']);
      chai.expect(parse('$.a[0].b')).to.deep.equal(['$', 'a', '0', 'b']);
    });
  });

});
