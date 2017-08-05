describe('base/Schedule', function() {
  var Schedule = Exact.Schedule;

  describe('Schedule.insert', function() {
    it('insert according to guid', function(done) {
      var flags = [];
      var o1 = {
        guid: 1,
        update: function() {
          flags.push(1);
        }
      };

      var o2 = {
        guid: 2,
        update: function() {
          flags.push(2);
          Schedule.insert(o3);
        }
      };

      var o3 = {
        guid: 3,
        update: function() {
          flags.push(3);
        }
      };

      Schedule.insert(o2);
      Schedule.insert(o1);

      setTimeout(function() {
        chai.expect(flags).to.deep.equal([1, 2, 3]);
        done();
      }, 0);
    });
  });

  describe('Schedule.append', function() {
    it('append according to time', function(done) {
      var flags = [];
      var o1 = {
        guid: 1,
        update: function() {
          flags.push(1);
        }
      };

      var o2 = {
        guid: 2,
        render: function() {
          flags.push(2);
        }
      };

      var o3 = {
        guid: 3,
        update: function() {
          flags.push(3);
        }
      };

      Schedule.insert(o3);
      Schedule.insert(o1);
      Schedule.append(o2);

      setTimeout(function() {
        chai.expect(flags).to.deep.equal([1, 3, 2]);
        done();
      }, 0);
    });
  });
});