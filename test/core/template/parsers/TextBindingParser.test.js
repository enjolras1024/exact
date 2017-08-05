describe('core/template/parsers/TextBindingParser', function() {
  describe('TextBindingParser.like', function() {
    var like = Exact.TextBindingParser.like;
    it('check if an expression may contain bindings', function() {
      chai.expect(like('abc123')).to.equal(false);
      chai.expect(like('abc@{}123')).to.equal(false);
      chai.expect(like('abc@{$.v123')).to.equal(false);
      chai.expect(like('abc@{$.v}123')).to.equal(true);
      chai.expect(like('abc&{$.v}123')).to.equal(true);
      chai.expect(like('abc&{$.v}123@{$.v}')).to.equal(true);
    });
  });

  describe('TextBindingParser.parse', function() {
    var parse = Exact.TextBindingParser.parse;

    it('parse text containing no binding', function() {
      chai.expect(parse('abc123', {}, [])).to.equal(null);
      chai.expect(parse('abc@{}123', {}, [])).to.equal(null);
      chai.expect(parse('abc@{ }123', {}, [])).to.equal(null);
      chai.expect(parse('abc@{$.v123&{$.v', {}, ['$'])).to.equal(null);
      chai.expect(parse('abc*{$.v}123#{$.v}', {}, ['$'])).to.equal(null);
    });

    it('parse text containing bindings', function() {
      var expression;

      expression = parse('abc@{$.v}123&{$.v}', {}, ['$']);
      chai.expect(expression).to.be.instanceOf(Exact.Expression);
      chai.expect(expression.template[0]).to.equal('abc');
      chai.expect(expression.template[1]).to.be.instanceOf(Exact.Expression);
      chai.expect(expression.template[2]).to.equal('123');
      chai.expect(expression.template[3]).to.be.instanceOf(Exact.Expression);
      chai.expect(expression.template[4]).to.equal('');

      expression = parse('&{$.v}123@{$.v}abc', {}, ['$']);
      chai.expect(expression).to.be.instanceOf(Exact.Expression);
      chai.expect(expression.template[0]).to.equal('');
      chai.expect(expression.template[1]).to.be.instanceOf(Exact.Expression);
      chai.expect(expression.template[2]).to.equal('123');
      chai.expect(expression.template[3]).to.be.instanceOf(Exact.Expression);
      chai.expect(expression.template[4]).to.equal('abc');

      expression = parse('@{$.v}123}&{$.v}abc}', {}, ['$']);
      chai.expect(expression).to.be.instanceOf(Exact.Expression);
      chai.expect(expression.template[0]).to.equal('');
      chai.expect(expression.template[1]).to.be.instanceOf(Exact.Expression);
      chai.expect(expression.template[2]).to.equal('123}');
      chai.expect(expression.template[3]).to.be.instanceOf(Exact.Expression);
      chai.expect(expression.template[4]).to.equal('abc}');
    });
  });
});