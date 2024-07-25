//npm run dev
const bodyParser = require('body-parser')
const express = require('express')
const request = require('request') //ability to send an Http get request.
const Blockchain = require('./blockchain')
const PubSub = require('./app/pubsub')
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const TransactionMiner = require('./app/transaction-miner');
const path = require('path');

const app = express()
const blockchain = new Blockchain()
const transactionPool = new TransactionPool();
const pubsub = new PubSub({ blockchain, transactionPool })
const wallet = new Wallet();
const transactionMiner = new TransactionMiner({ blockchain, transactionPool, wallet, pubsub });

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;//address of root node

app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'client/dist')));

app.get('/api/blocks', (req, res) => {//call back function gets fired when we hit the request
  res.json(blockchain.chain)
})

app.post('/api/mine', (req, res) => {
  const { data } = req.body

  blockchain.addBlock({ data })

  pubsub.broadcastChain()

  res.redirect('/api/blocks')
})

app.post('/api/transact', (req, res) => {
  const { amount, recipient } = req.body;

  let transaction = transactionPool.existingTransaction({ inputAddress: wallet.publicKey })

  try {
    if (transaction) {
      transaction.update({ senderWallet: wallet, recipient, amount });
    } else {
      transaction = wallet.createTransaction({
        recipient,
        amount,
        chain: blockchain.chain
      });
    }
  } catch(error) {
    return res.status(400).json({ type: 'error', message: error.message });
  }

  transactionPool.setTransaction(transaction);
  pubsub.broadcastTransaction(transaction);//publishes the transaction map to 3000 node and peers will subscribe and listens from
  //its channel of "transaction"

  console.log('transactionPool', transactionPool);

  res.json({ type: 'success', transaction });
});

app.get('/api/transaction-pool-map', (req, res) => {
  res.json(transactionPool.transactionMap);
});

app.get('/api/mine-transactions', (req, res) => {
  transactionMiner.mineTransactions();

  res.redirect('/api/blocks');
});

app.get('/api/wallet-info', (req, res) => {
  const address = wallet.publicKey;

  res.json({
    address,
    balance: Wallet.calculateBalance({ chain: blockchain.chain, address })
  });
});

app.get('*', (req, res) => {//to handle all other apis which are not configured in this file
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const syncWithRootState = () => {
  request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootChain = JSON.parse(body);

      console.log('replace chain on a sync with', rootChain);
      blockchain.replaceChain(rootChain);
    }
  });

  request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootTransactionPoolMap = JSON.parse(body);

      console.log('replace transaction pool map on a sync with', rootTransactionPoolMap);
      transactionPool.setMap(rootTransactionPoolMap);
    }
  });
};

//Below code is used to seed the backend with data to display in the front-end
const walletFoo = new Wallet();
const walletBar = new Wallet();

const generateWalletTransaction = ({ wallet, recipient, amount }) => {
  const transaction = wallet.createTransaction({
    recipient, amount, chain: blockchain.chain
  });

  transactionPool.setTransaction(transaction);
};

const walletAction = () => generateWalletTransaction({
  wallet, recipient: walletFoo.publicKey, amount: 5
});

const walletFooAction = () => generateWalletTransaction({
  wallet: walletFoo, recipient: walletBar.publicKey, amount: 10
});

const walletBarAction = () => generateWalletTransaction({
  wallet: walletBar, recipient: wallet.publicKey, amount: 15
});

for (let i=0; i<10; i++) {
  if (i%3 === 0) {
    walletAction();
    walletFooAction();
  } else if (i%3 === 1) {
    walletAction();
    walletBarAction();
  } else {
    walletFooAction();
    walletBarAction();
  }

  transactionMiner.mineTransactions();
}

// This will make sure that a new instance of the blockchain gets a true state of the historically grown
// blockchain as soon as it connects to the network.
// The idea behind this is that the root node will have had the most chances to sync up with the most historically
// grown and the majority blockchain array that is currently within the network.
// So it'll be good for a new peer to sync up with that root nodes blockchain.
// We use the listen function on the app object.
// The listen function is named listen because when the app starts up it will start listening for requests
// until it's told not to.

// if it just so happens that the root node doesn't have the
// true longest chain at the moment, eventually an even longer chain will come in from another
// node in the network and then either the newly started peer will pick up that and the root will pick
// up that anyway to allow any new peers to synchronize right away.
let PEER_PORT

if (process.env.GENERATE_PEER_PORT === 'true') {
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000)
}

const PORT = PEER_PORT || DEFAULT_PORT
app.listen(PORT, () => {
  console.log(`listening at localhost:${PORT}`);

  if (PORT !== DEFAULT_PORT) {
    // the root node is going to send a request to its
    // own address to synchronize, which is a redundant action.
    syncWithRootState();//if peer nodes starts on ports other than default port of 3000, call the function to sync with the root node
    //which is at port 3000
  }
});

