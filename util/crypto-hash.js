const crypto = require('crypto')

const cryptoHash = (...inputs) => {
    const hash = crypto.createHash('sha256');
  
    hash.update(inputs.map(input => JSON.stringify(input)).sort().join(' '));
  
    return hash.digest('hex');
  };
  
  module.exports = cryptoHash;

// The ...inputs syntax in JavaScript is known as the rest parameter. 
//It allows a function to accept an indefinite number of arguments as an array. 
//This is particularly useful when you want to create functions that can handle a variable number of inputs, 
//without knowing how many arguments will be passed when the function is called.