const Transaction = require('./transaction');

class TransactionPool {
    constructor() {
      this.transactionMap = {};
    }
  
    setTransaction(transaction) {
      this.transactionMap[transaction.id] = transaction;
    }

    clear() {
      this.transactionMap = {}; // clear transaction pool
    }

    setMap(transactionMap) {
      this.transactionMap = transactionMap;
    }
    
    existingTransaction({ inputAddress }) {
      const transactions = Object.values(this.transactionMap);//transactions is an array
  
      return transactions.find(transaction => transaction.input.address === inputAddress);
    }

    validTransactions() {
      return Object.values(this.transactionMap).filter(
        transaction => Transaction.validTransaction(transaction)
      );
    }

    clearBlockchainTransactions({ chain }) {//if the blocks are added to the chain, then clear them from the transaction pool
      for (let i=1; i<chain.length; i++) {
        const block = chain[i];
  
        for (let transaction of block.data) {
          if (this.transactionMap[transaction.id]) {
            delete this.transactionMap[transaction.id];
          }
        }
      }
    }

  }
  
  module.exports = TransactionPool;