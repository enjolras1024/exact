describe('base/Validator', function() {
  var Validator = Exact.Validator;
  var Collection = Exact.Collection;


  describe('Validator.validate', function() {
    var instance = Exact.assign({}, Exact.Watcher.prototype);

    it('Validation is unnecessary', function() {
      chai.expect(Validator.validate(instance, 'id', '123', {})).to.equal(true);
    });

    it('Validate the type', function() {
      var descriptors = {
        date: {
          type: Date
        },
        items: {
          type: Array
        },
        index: {
          type: 'number'
        },
        username: {
          type: 'string'
        },
        isActive: {
          type: 'boolean'
        }
      };

      instance.on('validated', function(event, error) {
        //console.log(error);
        if (error) {
          chai.expect(error).to.be.instanceOf(Error);
        }
      });

      //error = Validator.validate(instance, 'date', new Date(), descriptors);
      chai.expect(Validator.validate(instance, 'date', new Date(), descriptors.date)).to.equal(true);
      chai.expect(Validator.validate(instance, 'date', {}, descriptors.date)).to.equal(false);

      chai.expect(Validator.validate(instance, 'items', [], descriptors.items)).to.equal(true);
      chai.expect(Validator.validate(instance, 'items', new Collection(), descriptors.items)).to.equal(true);

      chai.expect(Validator.validate(instance, 'index', 0, descriptors.index)).to.equal(true);
      chai.expect(Validator.validate(instance, 'index', Number('0'), descriptors.index)).to.equal(true);
      chai.expect(Validator.validate(instance, 'index', new Number(0), descriptors.index)).to.equal(false);
      chai.expect(Validator.validate(instance, 'index', '0', descriptors.index)).to.equal(false);

      chai.expect(Validator.validate(instance, 'username', 'marvin', descriptors.username)).to.equal(true);
      chai.expect(Validator.validate(instance, 'username', String(123), descriptors.username)).to.equal(true);
      chai.expect(Validator.validate(instance, 'username', new String('123'), descriptors.username)).to.equal(false);
      chai.expect(Validator.validate(instance, 'username', true, descriptors.username)).to.equal(false);

      chai.expect(Validator.validate(instance, 'isActive', false, descriptors.isActive)).to.equal(true);
      chai.expect(Validator.validate(instance, 'isActive', Boolean(1), descriptors.isActive)).to.equal(true);
      chai.expect(Validator.validate(instance, 'isActive', new Boolean(true), descriptors.isActive)).to.equal(false);
      chai.expect(Validator.validate(instance, 'isActive', 0, descriptors.isActive)).to.equal(false);

      instance.off('validated');
    });

    it('Validate multiple types', function() {
      var descriptors = {
        date: {
          type: ['number', 'string', Date]
        }
      };

      instance.on('validated', function(event, error) {
        chai.expect(event.name).to.equal('date');
        if (error) {
          chai.expect(error).to.be.instanceOf(Error);
        }
      });

      //error = Validator.validate(instance, 'date', new Date(), descriptors);
      chai.expect(Validator.validate(instance, 'date', 123456, descriptors.date)).to.equal(true);
      chai.expect(Validator.validate(instance, 'date', '2016/11/18', descriptors.date)).to.equal(true);
      chai.expect(Validator.validate(instance, 'date', new Date(), descriptors.date)).to.equal(true);
      chai.expect(Validator.validate(instance, 'date', true, descriptors.date)).to.equal(false);

      instance.off('validated');
    });

    it('Validate the pattern', function() {
      var descriptors = {
        password: {
          validator: /[\w\$]{6,32}/
        }
      };

      instance.on('validated', function(event, error) {
        chai.expect(event.name).to.equal('password');
        if (error) {
          chai.expect(error).to.be.instanceOf(Error);
        }
      });

      //error = Validator.validate(instance, 'date', new Date(), descriptors);
      chai.expect(Validator.validate(instance, 'password', '$S3456', descriptors.password)).to.equal(true);
      chai.expect(Validator.validate(instance, 'password', '12345', descriptors.password)).to.equal(false);

      instance.off('validated');
    });

    it('Custom validation', function() {
      var descriptors = {
        password: {
          type: 'string',
          //pattern: /[\w\$]{6,32}/,
          validator: function(value) {
            if (value === '123456') {
              return new Error('123456 is unsafe');
            } else if (!/[\w\$]{6,32}/.test(value)) {
              return new Error('');
            }
          }
        }
      };

      instance.on('validated', function(event, error) {
        chai.expect(event.name).to.equal('password');
        if (error) {
          chai.expect(error.message).to.equal('123456 is unsafe');
        }
      });

      //error = Validator.validate(instance, 'date', new Date(), descriptors);
      chai.expect(Validator.validate(instance, 'password', '$S3456', descriptors.password)).to.equal(true);
      chai.expect(Validator.validate(instance, 'password', '123456', descriptors.password)).to.equal(false);

      instance.off('validated');
    });
  });


});

