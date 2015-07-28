bcrypt = require('bcrypt-nodejs');

// var hash = bcrypt.hashSync('Phillip','$2a$10$DE3bfs1SK0ZX/PRLiWt9he');
var hash1 = bcrypt.hashSync('Phillip', null);
var hash2 = bcrypt.hashSync('Phillip', null);
var hash3 = bcrypt.hashSync('Phillip', null);


// console.log(hash);

// var compare = bcrypt.compareSync('Phillip', '$2a$10$DE3bfs1SK0ZX/PRLiWt9he.uUdKVpCdZyG1B0k8vM3.7CMV31lZ8O');

// console.log("Compare: "+compare);

var compare1 = bcrypt.compareSync('Phillip', hash1);
console.log("Compare with this file's hash1: ", compare1);
console.log('Hash1: '+hash1);

var compare2 = bcrypt.compareSync('Phillip', hash2);
console.log("Compare with this file's hash2: ", compare2);
console.log('Hash2: '+hash2);


var compare3 = bcrypt.compareSync('Phillip', hash3);
console.log("Compare with this file's hash3: ", compare3);
console.log('Hash3: '+hash3);
