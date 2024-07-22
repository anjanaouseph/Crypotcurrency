const Transaction = require('./transaction');
const { STARTING_BALANCE } = require('../config');
const { ec, cryptoHash} = require('../util');

class Wallet {
    constructor() {
      this.balance = STARTING_BALANCE
      this.keyPair = ec.genKeyPair();

      this.publicKey = this.keyPair.getPublic().encode('hex');
    }

    sign(data) {
        return this.keyPair.sign(cryptoHash(data));
      }

    createTransaction({ recipient, amount, chain }) {
      if (chain) {
        this.balance = Wallet.calculateBalance({
          chain,
          address: this.publicKey
        });
      }
        if (amount > this.balance) {
          throw new Error('Amount exceeds balance');
        }
    
        return new Transaction({ senderWallet: this, recipient, amount });
      }

      static calculateBalance({ chain, address }) {

        let hasConductedTransaction = false;
        //to make sure that the calculated balance method does not accidentally double count outputs.
        //More specifically, if the address has already made a transaction, the balance should start from the
        //output for the address in that transaction and then only outputs within that block and afterward can
        //be added to the overall balance.
        //the dangers of our current implementation
        // of calculate balance, since it's using the entire blockchain history and not accounting for double
        // counting of certain outputs, it's going to report a deceptively high balance for the wallet.

        let outputsTotal = 0;
    
        for (let i=chain.length-1; i>0; i--) { //going from the top down because it's more
          //likely that the wallet has a recent transaction near the top of the list.
          const block = chain[i];
    
          for (let transaction of block.data) {

            if (transaction.input.address === address) {
              hasConductedTransaction = true;
            }

            const addressOutput = transaction.outputMap[address];
    
            if (addressOutput) {
              outputsTotal = outputsTotal + addressOutput;
            }
          }

          if (hasConductedTransaction) {
            break;
          }

        }
    
        return hasConductedTransaction ? outputsTotal : STARTING_BALANCE + outputsTotal;
      }
  }
  
  module.exports = Wallet