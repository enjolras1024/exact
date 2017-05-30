function PrivateBag() {
  this.map = {};
}

PrivateBag.prototype.get = function(obj) {
  if (!obj.__private_bag_key__) {
    var key;
    while (!key || key in this.map) {
      key = '' + Math.ceil(Math.random() * Number.MAX_VALUE);
    }
    obj.__private_bag_key__ = key;
    this.map[key] = {};
  }

  return this.map[obj.__private_bag_key__];
};