describe('core/models/Collection', function() {
  var Collection = Exact.Collection;

  var array = [1, 2, 3, 4, 5];
  var items = [{x:1}, {x:2}, {x:3},{x:4}];

  var collection;

  describe('constructor', function() {
    it('new Collection(3) works like new Array(3)', function() {
      collection = new Collection(3);
      chai.expect(collection.length).to.equal(3);
      chai.expect(collection.slice(0)).to.deep.equal([undefined, undefined, undefined]);
    });

    it('new Collection(1, 2, 3) works like new Array(1, 2, 3)', function() {
      collection = new Collection(1, 2, 3);
      chai.expect(collection.slice(0)).to.deep.equal([1, 2, 3]);
      chai.expect(collection.slice(0)).to.deep.equal(new Array(1, 2, 3));
    });
  });

  describe('Collection.from', function() {
    it('Collection.from works like Array.from in ES6', function() {
      collection = Collection.from(array);
      chai.expect(collection.slice(0)).to.deep.equal(array);
    });
  });

  describe('Collection.clean', function() {
    it('Collection.clean will make a collection valid', function() {
      chai.expect(collection.isInvalidated).to.equal(true);
      Collection.clean(collection);
      chai.expect(collection.isInvalidated).to.equal(false);
    });
  });

  describe('collection.push', function() {
    it('collection.push works like array.push', function() {
      var n1 = array.push(6, 7);
      var n2 = collection.push(6, 7);
      chai.expect(n1).to.equal(n2);
      chai.expect(collection.slice(0)).to.deep.equal(array);
    });
  });

  describe('collection.pop', function() {
    it('collection.pop works like array.pop', function() {
      var n1 = array.pop();
      var n2 = collection.pop();
      chai.expect(n1).to.equal(n2);
      chai.expect(collection.slice(0)).to.deep.equal(array);
    });
  });

  describe('collection.unshift', function() {
    it('collection.unshift works like array.unshift', function() {
      var n1 = array.unshift(-1, 0);
      var n2 = collection.unshift(-1, 0);
      chai.expect(n1).to.equal(n2);
      chai.expect(collection.slice(0)).to.deep.equal(array);
    });
  });

  describe('collection.shift', function() {
    it('collection.shift works like array.shift', function() {
      var n1 = array.shift();
      var n2 = collection.shift();
      chai.expect(n1).to.equal(n2);
      chai.expect(collection.slice(0)).to.deep.equal(array);
    });
  });

  describe('collection.splice', function() {
    it('remove', function() {
      var a1 = array.splice(5);
      var a2 = collection.splice(5);

      chai.expect(a1).to.deep.equal(a2);
      chai.expect(a2).to.be.instanceOf(Array);
      chai.expect(collection.slice(0)).to.deep.equal(array);

      var a3 = array.splice(0, 1);
      var a4 = collection.splice(0, 1);

      chai.expect(a3).to.deep.equal(a4);
      chai.expect(a4).to.be.instanceOf(Array);
      chai.expect(collection.slice(0)).to.deep.equal(array);
    });
    
    it('insert', function() {
      var a1 = array.splice(0, 0, 0);
      var a2 = collection.splice(0, 0, 0);

      chai.expect(a1).to.deep.equal(a2);
      chai.expect(a2).to.be.instanceOf(Array);
      chai.expect(collection.slice(0)).to.deep.equal(array);

      var a3 = array.splice(5, 0, 5, 6);
      var a4 = collection.splice(5, 0, 5, 6);

      chai.expect(a3).to.deep.equal(a4);
      chai.expect(a4).to.be.instanceOf(Array);
      chai.expect(collection.slice(0)).to.deep.equal(array);
    });

    it('remove and insert', function() {
      var a1 = array.splice(3, 1, 7, 8);
      var a2 = collection.splice(3, 1, 7, 8);

      chai.expect(a1).to.deep.equal(a2);
      chai.expect(a2).to.be.instanceOf(Array);
      chai.expect(collection.slice(0)).to.deep.equal(array);
    });
  });

  describe('collection.sort', function() {
    it('collection.sort works like array.sort', function() {
      var a = array.sort();
      var c = collection.sort();
      chai.expect(array).to.equal(a);
      chai.expect(collection).to.equal(c);
      chai.expect(collection.slice(0)).to.deep.equal(array);
    });
  });

  describe('collection.reverse', function() {
    it('collection.reverse works like array.reverse', function() {
      var a = array.reverse();
      var c = collection.reverse();
      chai.expect(array).to.equal(a);
      chai.expect(collection).to.equal(c);
      chai.expect(collection.slice(0)).to.deep.equal(array);
    });
  });

  describe('collection.set', function() {
    it('collection.set(index, item) works like array[index] = item', function() {
      chai.expect(collection[9]).to.equal(undefined);

      array[8] = 9;
      collection.set(8, 9);

      //console.log(array);
      //console.log(collection.slice(0));

      chai.expect(collection.slice(0)).to.deep.equal(array);

    });
  });

  describe('collection.reset', function() {
    it('reset collection', function() {
      collection.reset([1]);
      chai.expect(collection.slice(0)).to.deep.equal([1]);

      collection.reset(items);
      chai.expect(collection.slice(0)).to.deep.equal(items);
    });
  });

  describe('collection.remove', function() {
    it('remove an item from collection', function() {
      collection.remove(items.pop());
      chai.expect(collection.slice(0)).to.deep.equal(items);

      collection.remove(items.shift());
      chai.expect(collection.slice(0)).to.deep.equal(items);
    });

    it('item to be removed must be object', function() {
      var flag;

      flag = false;
      try {
        collection.remove(true);
      } catch (error) {
        flag = true;
      }
      chai.expect(flag).to.equal(true);
    });

    it('item to be removed must be included in collection', function() {
      var flag;

      flag = false;
      try {
        collection.remove({x: 3});
      } catch (error) {
        flag = true;
      }
      chai.expect(flag).to.equal(true);
    });
  });

  describe('collection.insert', function() {
    it('insert a item into collection', function() {
      var flag = false;

      collection.on('changed', function() {
        flag = true;
      });

      collection.insert(items[0], items[0]);
      chai.expect(flag).to.equal(false);

      collection.insert(items[1], items[0]);
      chai.expect(flag).to.equal(true);
      chai.expect(collection.slice(0)).to.deep.equal([items[1], items[0]]);

      collection.off();

      items.push({x: 3});
      collection.insert(items[2]);
      chai.expect(collection.slice(0)).to.deep.equal([items[1], items[0], items[2]]);
    });

    it('`before` item must be included in collection', function() {
      var flag;

      flag = false;
      try {
        collection.insert({x:4}, {x: 3});
      } catch (error) {
        flag = true;
      }
      chai.expect(flag).to.equal(true);
    });
  });

  describe('collection.replace', function() {
    it('replace an old item with new item', function() {
      collection.replace(items[1], items[0]);
      chai.expect(collection.slice(0)).to.deep.equal([items[1], items[1], items[2]]);
    });

    it('old item must be included in collection', function() {
      var flag;

      flag = false;
      try {
        collection.replace({x:4}, {x: 3});
      } catch (error) {
        flag = true;
      }
      chai.expect(flag).to.equal(true);
    });

    it('items to be exchanged must be objects', function() {
      var flag;

      flag = false;
      try {
        collection.replace(true, items[0]);
      } catch (error) {
        flag = true;
      }
      chai.expect(flag).to.equal(true);

      flag = false;
      try {
        collection.replace({x:4}, '{x:1}');
      } catch (error) {
        flag = true;
      }

      chai.expect(flag).to.equal(true);
    });
  });

  describe('collection.slice, collection.concat...', function() {
    it('collection.slice returns array not collection', function() {
      var a = collection.slice(0);
      chai.expect(a).to.be.instanceOf(Array);
    });

    it('collection.concat returns array not collection', function() {
      var a = collection.concat([]);
      chai.expect(a).to.be.instanceOf(Array);
    });
  });

  describe('collection.on("changed", handler)', function() {
    it('event "changed" is dispatched when collection has changed', function() {
      var flag = 0;
      collection.on('changed', function() {
        ++flag;
      });

      collection.on('changed.length', function() {
        ++flag;
      });

      collection.set(1, collection[1]);
      chai.expect(flag).to.equal(0);

      collection.set(7, {x: 8});
      chai.expect(flag).to.equal(1);

      collection.pop();
      chai.expect(flag).to.equal(3);
    });
  });
});