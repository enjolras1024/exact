describe('utils/StringUtil', function() {

  describe('StringUtil.split', function() {
    var split = Exact.StringUtil.split;

    it('split a empty string that contains no delimiter', function() {
      chai.expect(split(',./', ';', '()'))
        .to.deep.equal([',./']);
    });

    it('split a string that contains a sub-string', function() {
      chai.expect(split("';' ; 'I\\'m'; (;); (;(;);)", ';', '()'))
        .to.deep.equal(["';'", "'I\\'m'", '(;)', '(;(;);)']);
    });

    it('split a style-like string', function() {
      chai.expect(split('color: red; font-size?: @{$.fontSize}px;', ';', '{}'))
        .to.deep.equal(['color: red', 'font-size?: @{$.fontSize}px']);
    });

    it('split a empty string', function() {
      chai.expect(split('', ';', '()'))
        .to.deep.equal([]);
    });

  });

  describe('StringUtil.range', function() {
    var range = Exact.StringUtil.range;

    it('return the range of "@{.*}" in a string', function() {
      chai.expect(range(' @{ $.a } @{ {x: 1} \'}\'}', 0, '@', '{}')).to.deep.equal([1, 9]);
      chai.expect(range(' @{ $.a } @{ {x: 1} \'}\'}', 10, '@', '{}')).to.deep.equal([10, 24]);
      chai.expect(range(' @{ $.a } @{ {x: 1} \'}\'}', 25, '@', '{}')).to.equal(null);
      chai.expect(range(' \\@{ $.a } \\@{ {x: 1} \'}\'}', 0, '@', '{}')).to.equal(null);
    });
  });

});
