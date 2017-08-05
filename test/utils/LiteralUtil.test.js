//Exact.ObjectUtil.namespace('a.b.c');

describe('utils/LiteralUtil', function() {
  var LiteralUtil = Exact.LiteralUtil;

  describe('LiteralUtil.parse', function() {
    it('expr must be string', function() {
      var value;
      try {
        value = LiteralUtil.parse(true)
      } catch(error) {

      }
      chai.expect(value).to.equal(undefined);
    });

//    it('Parses string from string', function() {
//      chai.expect(LiteralUtil.parse('"ture"')).to.be.a('string');
//      chai.expect(LiteralUtil.parse("'infinity'")).to.be.a('string');
//      chai.expect(LiteralUtil.parse("'0123456789'")).to.be.a('string');
//    });

    it('parse value from blank string', function() {
      chai.expect(LiteralUtil.parse('')).to.equal(undefined);
      chai.expect(LiteralUtil.parse('   ')).to.equal(undefined);
    });

    it('parse boolean value from string', function() {
      chai.expect(LiteralUtil.parse('true')).to.equal(true);
      chai.expect(LiteralUtil.parse(' false ', 'boolean')).to.equal(false);
    });

    it('parse special values like null, undefined', function() {
      chai.expect(LiteralUtil.parse('null')).to.be.a('null');
      chai.expect(LiteralUtil.parse('undefined ')).to.be.an('undefined');
    });

    it('parse special number from string', function() {
      chai.expect(LiteralUtil.parse('NaN')).to.be.an('number');
      chai.expect(LiteralUtil.parse(' -Infinity')).to.equal(-Infinity);
    });

    it('parse decimal number from string', function() {
      chai.expect(LiteralUtil.parse('10')).to.equal(10);
      chai.expect(LiteralUtil.parse('-.10')).to.equal(-0.1);
      chai.expect(LiteralUtil.parse(' 0123456789', 'number')).to.equal(123456789);
    });

    it('parse undeclared type of value from string', function() {
      var error;
      try {
        LiteralUtil.parse('10', 'xxx');
      } catch (e) {
        error = e;
      }
      chai.expect(error).to.be.instanceOf(Error);
    });

//    it('parse binary number from string', function() {
//      chai.expect(LiteralUtil.parse('0b010')).to.equal(2);// error in IE
//      chai.expect(LiteralUtil.parse('0B011', 'number')).to.equal(3);// error in IE
//    });
//
//    it('parse octal number from string', function() {
//      chai.expect(LiteralUtil.parse('0o010')).to.equal(8);// error in IE
//      chai.expect(LiteralUtil.parse('0O017', 'number')).to.equal(15);// error in IE
//    });

    it('parse hexadecimal number from string', function() {
      chai.expect(LiteralUtil.parse('0x010')).to.equal(16);
      chai.expect(LiteralUtil.parse('0X00f', 'number')).to.equal(15);
    });

    it('parse scientific number from string', function() {
      chai.expect(LiteralUtil.parse('1.2e-3')).to.equal(0.0012);
      chai.expect(LiteralUtil.parse('1.2E+3', 'number')).to.equal(1200);
    });

    it('parse string from string', function() {
      chai.expect(LiteralUtil.parse('"true"')).to.be.a('string');
      chai.expect(LiteralUtil.parse('"true"')).to.equal('true');
      chai.expect(LiteralUtil.parse("'true'")).to.be.a('string');
      chai.expect(LiteralUtil.parse("'true'")).to.equal('true');
      chai.expect(LiteralUtil.parse("'true'", 'string')).to.equal("'true'");

      chai.expect(LiteralUtil.parse('"[0, 1, 2, 3, 4, 5]"')).to.be.a('string');
    });

    it('parse object, array in JSON', function() {
      chai.expect(LiteralUtil.parse('[1, "1", {}, [], true, null]')).to.be.instanceOf(Array);
      chai.expect(LiteralUtil.parse('{"num":123, "str":"123", "arr":[1,2,3], "obj": null}', 'json')).to.be.an('object');
    });

//    it('Returns the string, else', function() {
//      chai.expect(LiteralUtil.parse('ture')).to.equal('ture');
//      chai.expect(LiteralUtil.parse('infinity')).to.equal('infinity');
//      chai.expect(LiteralUtil.parse('10o')).to.equal('10o');
//      chai.expect(LiteralUtil.parse('0b012')).to.equal('0b012');
//      chai.expect(LiteralUtil.parse('0o019')).to.equal('0o019');
//      chai.expect(LiteralUtil.parse('0x01g')).to.equal('0x01g');
//    });

    it('return undefined, else', function() {
      chai.expect(LiteralUtil.parse('${name}')).to.be.an('undefined');
      chai.expect(LiteralUtil.parse('ture')).to.be.an('undefined');
      chai.expect(LiteralUtil.parse('infinity')).to.be.an('undefined');
      chai.expect(LiteralUtil.parse('10o')).to.be.an('undefined');
      chai.expect(LiteralUtil.parse('0b012')).to.be.an('undefined');
      chai.expect(LiteralUtil.parse('0o019')).to.be.an('undefined');
      chai.expect(LiteralUtil.parse('0x01g')).to.be.an('undefined');
    });
  });
});
