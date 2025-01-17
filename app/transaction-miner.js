
const Transaction = require('../wallet/transaction');

class TransactionMiner {
    constructor({ blockchain, transactionPool, wallet, pubsub }) {
      this.blockchain = blockchain;
      this.transactionPool = transactionPool;
      this.wallet = wallet;
      this.pubsub = pubsub;
    }
  
    mineTransactions() {
      //1.get the transaction pool's valid transactions
      const validTransactions = this.transactionPool.validTransactions();
  
      //2.generate the miner's reward
      validTransactions.push(
        Transaction.rewardTransaction({ minerWallet: this.wallet })//give a reward to the miner for mining a new block
      );
  
      //3.add a block consisting of these transactions to the blockchain
      this.blockchain.addBlock({ data: validTransactions });
  
      //4.broadcast the updated blockchain
      this.pubsub.broadcastChain();
  
      //5.clear the pool
      this.transactionPool.clear();
    }
  }
  
  module.exports = TransactionMiner;