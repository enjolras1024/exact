describe('share/RES', function() {
  describe('RES', function() {
    var RES = Exact.RES;

    it('RES.register', function() {
      // success
      chai.expect(RES.register('NAME', 'Marvin')).to.equal(true);
      chai.expect(RES.register('secrets.age', 20)).to.equal(true);

      chai.expect(RES.NAME).to.equal('Marvin');
      chai.expect(RES.secrets.age).to.equal(20);

      // can not register one that has been registered
      chai.expect(RES.register('NAME', 'Marvin')).to.equal(false);
      chai.expect(RES.register('secrets.age', 40)).to.equal(false);

      // host must be object
      var error;
      try {
        RES.register('NAME.length', 1);
      } catch (err) {
        error = err;
      }
      chai.expect(error).not.equal(undefined);
    });

    it('RES.search in RES', function() {
      chai.expect(RES.search('NAME')).to.equal('Marvin');
      chai.expect(RES.search('secrets.age')).to.equal(20);
      chai.expect(RES.search('secrets.sex')).to.equal(undefined);
      chai.expect(RES.search('nothing.age')).to.equal(undefined);

      //// global variables are not accessed
      //chai.expect(RES.search('Math')).to.equal(undefined);
      //chai.expect(RES.search('Date')).to.equal(undefined);

      chai.expect(RES.search('Math')).to.equal(Math);
      chai.expect(RES.search('Date')).to.equal(Date);
    });

    it('RES.search in locals', function() {
      var locals = {
        x: 1, o: {y : 2}
      };

      chai.expect(RES.search('x', locals, true)).to.equal(1);
      chai.expect(RES.search('o.y', locals, true)).to.equal(2);
      chai.expect(RES.search('NAME', locals, true)).to.equal(undefined);
      chai.expect(RES.search('secrets.age', locals, true)).to.equal(undefined);
    });

    it('RES.search in locals firstly, then in RES', function() {
      var locals = {
        x: 1, o: {y : 2}, NAME: 'Marry'
      };

      chai.expect(RES.search('x', locals)).to.equal(1);
      chai.expect(RES.search('o.y', locals)).to.equal(2);
      chai.expect(RES.search('NAME', locals)).to.equal('Marry');
      chai.expect(RES.search('secrets.age', locals)).to.equal(20);
    });
  });

});




