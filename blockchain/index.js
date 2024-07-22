//node blockchain.js
const Block = require('./block');
const {cryptoHash} = require('../util');
const Transaction = require('../wallet/transaction');
const { REWARD_INPUT, MINING_REWARD } = require('../config');
const Wallet = require('../wallet');

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

  replaceChain(chain, validateTransactions, onSuccess) {//validateTransactions flag is only added because it's a pain to 
    //refactor the earlier added test cases which doesn't pass a transaction in the data field instead passes "foo", so instead we pass the flag, which
    //skips the validate transaction data check.
    if (chain.length <= this.chain.length) {
      console.error('The incoming chain must be longer');

      return;
    }

    if (!Blockchain.isValidChain(chain)) {
      console.error('The incoming chain must be valid');

      return;
    }

    //We don't want the chain to be replaced when the chain is found to have invalid transaction
    if (validateTransactions && !this.validTransactionData({ chain })) {
      // If it's false, it won't bother running the second check over here.
      // So this allows us to now skip the `this.validTransactionData` method call with a validate transactions flag.
      
      console.error('The incoming chain has invalid data'); //add a new condition that checks the return boolean value from 
      // calling a valid transaction data
      // on the incoming chain.
      // If this is found to be false, well, we'll output an error that the incoming chain has invalid transaction
      return;
    }

    if (onSuccess) onSuccess();// on success represents a callback function, so we'll only call this if we make it to a successful
    //chain replacement.

    console.log('replacing chain with', chain);
    this.chain = chain;
  }

  //Why we need validation of the data field?
  // even though the data field can't be tampered with, technically someone could still generate an
  // arbitrary data field for any block from the start.
  // The trick is not tampering with an existing block, but creating an entirely new block with evil information
  // for the data field.
  // Then all the timestamp difficulty last hash and the evil data field will be used to find a valid hash
  // and nonce that matches the difficulty.
  // So the hash is valid even though the data itself is evil.
  // The data hasn't been tampered with after all.
  // So as long as the data field does correctly generate a last hash or rather regenerate the hash in the
  // block according to the is valid chain method, that block will be deemed valid in the chain.
  // So it goes without saying that we don't want to leave this vulnerability unprotected.
  // The solution is to run a few checks on the data field itself.


  // To make sure that the transactional data is valid 

  // And those rules are as follows.

  // 1. Each transaction in the block must be correctly formatted.
  // valid transaction method in the project and this correctly ensures that
  // the outputs have been formatted correctly with good amounts.
  // More importantly, it checks that the inputs official signature is valid.
  // Since this rule is checking that the outputs are formatted correctly, this includes making sure that
  // any reward transactions have the correct mining reward value.

  // 2.A block consisting of transactional data can't have multiple mining rewards.
  // There should only be one.

  // 3.The blocks input amounts should be valid according to the blockchain history, meaning that
  // if we recalculate the balance for that address by examining the preexisting blockchain, that amount
  // should match the calculated balance.

  // 4.There cannot be multiple identical transactions in the same block.
  // The block should be a set of transactions with no duplicates.


  validTransactionData({ chain }) {
    for (let i=1; i<chain.length; i++) {
      const block = chain[i];
      const transactionSet = new Set();
      let rewardTransactionCount = 0;

      for (let transaction of block.data) {
        if (transaction.input.address === REWARD_INPUT.address) {
          rewardTransactionCount += 1;

          //2. Only one mining reward per block.
          if (rewardTransactionCount > 1) {
            console.error('Miner rewards exceeds limit');
            return false;
          }

          if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
            console.error('Miner reward amount is invalid');
            return false;
          }
        } else {
          //1. Each transaction must be correctly formatted
          // valid transaction method in the project and this correctly ensures this and also checks the signatures are valid as well.
          if (!Transaction.validTransaction(transaction)) {
            console.error('Invalid transaction');
            return false;
          }

          //3.Valid input amounts according to balance in blockchain history
          const trueBalance = Wallet.calculateBalance({
            chain: this.chain,
            address: transaction.input.address
          });

          if (transaction.input.amount !== trueBalance) {
            console.error('Invalid input amount');
            return false;
          }

          //4. Blocks must not have identical transactions
          if (transactionSet.has(transaction)) {
            console.error('An identical transaction appears more than once in the block');
            return false;
          } else {
            transactionSet.add(transaction);
          }
        }
      }
    }

    return true;
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