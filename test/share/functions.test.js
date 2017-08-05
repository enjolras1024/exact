describe('share/functions', function() {
  describe('help', function() {
    function Foo() {}

    Foo.prototype.work = function() {
      chai.expect(this).to.be.instanceOf(Foo);
    };
    Foo.prototype.wait = function() {
      chai.expect(this).to.be.instanceOf(Foo);
    };
    Foo.prototype.walk = function(distance) {
      chai.expect(this).to.be.instanceOf(Foo);
      chai.expect(distance).to.equal(100);
    };

    var foo = new Foo();

    it('help to bind methods', function() {
      Exact.help(foo).bind('work', 'wait');

      var work = foo.work;
      var wait = foo.wait;

      work();
      wait();
    });

    //it('help to bind methods with some rest parameters', function() {
    //  Exact.help(foo).bind({
    //    walk: [100]
    //  });
    //
    //  foo.walk();
    //});
  });

  //describe('setImmediate', function() {
  //  var setImmediate = Exact.setImmediate;
  //
  //  it('setImmediate vs setTimeout', function() {
  //
  //    var i = 0;
  //
  //    setTimeout(function(done) {
  //      chai.expect(++i).to.equal(2);
  //      console.log(i === 2);
  //      setTimeout(function() {
  //        chai.expect(++i).to.equal(4);
  //        console.log(i === 4);
  //      });
  //      //done();
  //    });
  //
  //    setImmediate(function() {
  //      chai.expect(++i).to.equal(1);
  //      console.log(i === 1);
  //      setImmediate(function() {
  //        chai.expect(++i).to.equal(3);
  //        console.log(i === 3);
  //      });
  //    });
  //
  //  });
  //});
  
  describe('assign', function() {
    it('should throw error when we assign properties to null or undefined', function() {
      var obj;

      try {
        obj = Exact.assign(null, {x: 1, y: 2});
      } catch(error) {

      }

      chai.expect(obj).to.equal(undefined);

      try {
        obj = Exact.assign(undefined, {x: 1, y: 2});
      } catch(error) {

      }

      chai.expect(obj).to.equal(undefined);
    });


    it('should success when we assign the properties of sources to target', function() {
      var target = {x: 1, y: 2}, sources = [{y: 2.5, z: 3}, {z:4, w: 5}];

      Exact.assign(target, sources[0], sources[1]);

      chai.expect(target.x).to.equal(1);
      chai.expect(target.y).to.equal(2.5);
      chai.expect(target.z).to.equal(4);
      chai.expect(target.w).to.equal(5);
    });

    it('should convert boolean, number or string target to object', function() {
      var bool = Exact.assign(false, {value: false});
      chai.expect(bool).to.instanceOf(Boolean);
      chai.expect(bool.value).to.equal(false);
      chai.expect(bool.valueOf()).to.equal(false);

      var num = Exact.assign(0, {value: 0});
      chai.expect(num).to.instanceOf(Number);
      chai.expect(num.value).to.equal(0);
      chai.expect(num.valueOf()).to.equal(0);

      var str = Exact.assign('', {value: ''});
      chai.expect(str).to.instanceOf(String);
      chai.expect(str.value).to.equal('');
      chai.expect(str.valueOf()).to.equal('');
    });

    it('should ignore boolean, number or string sources', function() {
      var target = {x: 1, y: 2}, sources = [{y: 2.5, z: 3}, {z:4, w: 5}];

      Exact.assign(target, false, sources[0], 0, sources[1], '');

      chai.expect(target.x).to.equal(1);
      chai.expect(target.y).to.equal(2.5);
      chai.expect(target.z).to.equal(4);
      chai.expect(target.w).to.equal(5);
    });
  });

  describe('setImmediate', function() {
    it('setImmediate', function(done) {
      var a = 1;
      Exact.setImmediate(function() {
        a = 2;
      });
      setTimeout(function() {
        chai.expect(a).to.equal(2);
        done();
      }, 0);
      a = 3;
    })
  });

  describe('defineClass', function() {
    var Man, Person, Student, Teacher;

    it('subClass and superClass must be Function', function() {
      var subClass, superClass;

      try {
        subClass = Exact.defineClass({
          constructor: {}
        });
      } catch (error) {}

      chai.expect(subClass).to.equal(undefined);

      try {
        subClass = Exact.defineClass({
          extend: superClass
        });
      } catch (error) {}

      chai.expect(subClass).to.equal(undefined);
    });

    it('Person inherits from Object with default constructor', function() {
      Person = Exact.defineClass({
        name: 'person',
        getName: function() {
          return this.name;
        },
        statics: {
          getNameOf: function(person) {
            return person.name;
          }
        }
      });

      var person = new Person();
      chai.expect(person.getName()).to.equal('person');
      chai.expect(Person.getNameOf(person)).to.equal('person');
    });

    it('Man inherits from Person with default constructor', function() {
      Man = Exact.defineClass({
        extend: Person,
        name: 'man',
        sex: 'male',
        getSex: function() {
          return this.sex;
        }
      });

      var man = new Man();
      chai.expect(man.getName()).to.equal('man');
      chai.expect(man.getSex()).to.equal('male');
      chai.expect(Person.getNameOf(man)).to.equal('man');
    });


    it('Student inherits from Person with custom constructor', function() {
      Student = Exact.defineClass({
        constructor: function(number) {
          this.number = number;
        },
        extend: Person
      });

      var student = new Student('123');
      chai.expect(student.number).to.equal('123');
    });

    var numberGetter = {
      getNumber: function() {
        return 't'+this.number;
      }
    };

    it('Teacher inherits from Person with custom constructor and mixins', function() {
      Teacher = Exact.defineClass({
        constructor: function(number) {
          this.name = 'teacher';
          this.number = number;
        },
        extend: Person,
        mixins: [numberGetter],

        statics: {
          mixins: [Person]
        }
      });

      var teacher = new Teacher('123');
      chai.expect(teacher.getNumber()).to.equal('t123');
      chai.expect(Teacher.getNameOf(teacher)).to.equal('teacher');
    });
  });

});




