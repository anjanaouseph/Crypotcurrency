//node blockchain.js
const Block = require('./block');
const cryptoHash = require('./crypto-hash');

class Blockchain {

  constructor() {
    this.chain = [Block.genesis()];//blockchain that starts with the genesis block
  }

  addBlock({ data }) {
    const newBlock = Block.minedBlock({
      lastBlock: this.chain[this.chain.length-1],
      data
    });

    this.chain.push(newBlock);
  }

  replaceChain(chain) {
    if (chain.length <= this.chain.length) {
      console.error('The incoming chain must be longer');

      return;
    }

    if (!Blockchain.isValidChain(chain)) {
      console.error('The incoming chain must be valid');

      return;
    }

    console.log('replacing chain with', chain);
    this.chain = chain;
  }

  static isValidChain(chain) {
    if(JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

    for (let i=1; i<chain.length; i++) {
      const { timestamp, lastHash, hash,nonce, difficulty, data } = chain[i];

      const actualLastHash = chain[i-1].hash;
      const lastDifficulty = chain[i-1].difficulty;//possible attack on the blockchain where someone could create a 
      //block with an arbitrarily low difficulty value. After all, the difficulty adjusts according to the 
      //mining rate of the system.That way they could generate an extremely long chain using blocks with really low difficulty values.

      if (lastHash !== actualLastHash) return false;

      const validatedHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty,);

      if (hash !== validatedHash) return false;
      
      if (Math.abs(lastDifficulty - difficulty) > 1) return false;//prevents difficulty jumps from going to high or too low
      //could generate an extremely long chain using blocks with really low difficulty values.
      //someone were to raise the difficulty of the system, they could slow down the entire blockchain
      //network for everyone involved with such a high difficulty.
      //It would be hard for the blockchain to have enough time to generate a hash that meets the difficulty
    }

    return true;
  }
}

module.exports = Blockchain;