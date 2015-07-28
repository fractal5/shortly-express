var db = require('../config');
var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'));

var User = db.Model.extend({
  tableName: 'users',
  link: function() {
    return this.hasMany(Link);
  },
  initialize: function(){
    console.log('**** model attrs on initialize: ', this.attributes);
    this.on('creating', function(model, attrs, options) {
      // XXX - temporarily storing cleartext password to use later
      // model.set('passwordhash', attrs.password);
      console.log('Model creating attrs.password: '+ attrs.password + ' hash ' + model.get('passwordhash'));
    });

    this.on('saving', function(model, attrs, options){
      // bcrypt - get salt
      var password = model.get('passwordhash');
      console.log('*** User saving: attrs.password: ', password);
      console.log('model: ', model);
      console.log('attrs: ', attrs);

      return bcrypt.hashAsync(password, null, null)
        .then(function(hash) {
          model.set('passwordhash', hash);
          console.log('pwhash after setting: ',model.get('passwordhash'));
        })
        .catch(function(err) {
          console.log('User initialization error: ', err);
        });
    });
  },
  checkPassword: function(password) {
    console.log("checkPassword input password: ",password);
    var hash = this.get('passwordhash');
    console.log("checkPassword current hashed password", hash); 

    var philliphash = bcrypt.compareSync('Phillip', hash);
    console.log('philliphash: ', philliphash); 

    return bcrypt.compareAsync(password, hash);

  },

});

module.exports = User;

