const redis = require('redis')
//using pubsub we dont need to know the addresses of other nodes in the network. 
//So there's less overhead in terms of keeping track of that.
const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION'
}

class PubSub {
  constructor({blockchain, transactionPool}) {
    //When you instantiate PubSub with new PubSub(), two Redis clients are created: one for publishing (this.publisher) and 
    //one for subscribing (this.subscriber).

    this.blockchain = blockchain
    this.transactionPool = transactionPool
    //First is that we want the blockchain to be able to broadcast its chain.
    //And second, we want the blockchain to try replacing its chain if it receives a valid blockchain message.
    this.publisher = redis.createClient()
    this.subscriber = redis.createClient()
    //The Redis server keeps track of which clients are subscribed to which channels.

    this.subscribeToChannels()

    this.subscriber.on(
      'message',//name of the event that redis client will listen
      (channel, message) => this.handleMessage(channel, message)//The .on method is used to register an event listener for the 'message' event on the subscriber instance.
      //The 'message' event is emitted whenever a message is published to any of the channels that the subscriber is subscribed to.
    )
  }

  handleMessage(channel, message) {
    console.log(`Message received. Channel: ${channel}. Message: ${message}`)
    const parsedMessage = JSON.parse(message)
  
    switch(channel) {
      case CHANNELS.BLOCKCHAIN:
        //can skip the below `true` flag if we are not using test cases.
        this.blockchain.replaceChain(parsedMessage, true, () => {//This should take care of clearing the transaction pools across the 
          //entire network of all recorded
         // transactions once they're in the blockchain history and the chains have been replaced, including those
         // transactions within the chain data itself.
          this.transactionPool.clearBlockchainTransactions({
             chain: parsedMessage
          });
          // in this case we're going to want to pass in a callback function on a successful replace chain that
          // And in the on success case, well, we want to clear this local transaction pool of the existing blockchain
          // transactions.
          // peers can have pools with transactions that have already been mined to the blockchain.
          // This is an issue because we don't want identical transactions to be counted twice in the blockchain history
          // Therefore, we're going to add the functionality to clear transaction pools across all nodes in the
          // network if their blockchains are successfully replaced with transaction data.
        });
        break;
      case CHANNELS.TRANSACTION:
        this.transactionPool.setTransaction(parsedMessage);
        break;
      default:
        return;
    }
  
    //replace chain method has been configured to only replace the chain if the parsed
    //message and the broadcasted blockchain is a truly valid chain and a longer one.
  
  }
    subscribeToChannels() {
    Object.values(CHANNELS).forEach(channel => {
      this.subscriber.subscribe(channel)
    })
  }

publish({ channel, message }) {
  this.subscriber.unsubscribe(channel, () => {
    this.publisher.publish(channel, message, () => {
      this.subscriber.subscribe(channel);
    });

    // In our publisher subscriber class, the publisher always publishes a message to itself.
    // Because it broadcasts a message on a channel to every subscriber to that channel.
    // The pub sub class currently sends messages to itself.
    // After all, it's subscribed to the channels that it's using as a publisher too.

    // makes a three step process where first we unsubscribe from the channel, then we publish the
    // message to our channel, and then we subscribe back to that channel again.
    // this will make sure publishers do not send non-consequential messages to the same local subscriber.
  });
}

broadcastChain() {
  this.publish({
    channel: CHANNELS.BLOCKCHAIN,
    message: JSON.stringify(this.blockchain.chain)
  });
}

broadcastTransaction(transaction) {
  this.publish({
    channel: CHANNELS.TRANSACTION,
    message: JSON.stringify(transaction)
  })
}
}

module.exports = PubSub

// goal with this test pub sub instance is to receive a message on the test channel and then

//log that message with the handle message function.


// client registration actually happens asynchronously.
// So first up, this means that the publish function can fire.
// But at this time, since the subscribe and the subscriber on function is actually registering in the
// background, it's not configured totally to receive that message yet.
// When the publish happens.
// So to demonstrate we can set a delay on this publish to make sure that all of this subscription and
// registration finishes before the publish actually occurs.
// We can use the set timeout method to create a callback that calls test pub sub publisher dot publish
// and then we'll set a delay of 1000 milliseconds as the second parameter to the set timeout.
// And this is equivalent to one second

// When you run pubsub.js in two different command-line interfaces (CMDs), both instances act as separate subscribers to the TEST channel. 
// When a message is published to this channel, Redis delivers it to all subscribers, which includes both instances of your script.