//npm run dev
const bodyParser = require('body-parser')
const express = require('express')
const request = require('request') //ability to send an Http get request.
const Blockchain = require('./blockchain')
const PubSub = require('./pubsub')

const app = express()
const blockchain = new Blockchain()
const pubsub = new PubSub({ blockchain })

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;//address of root node

app.use(bodyParser.json())

app.get('/api/blocks', (req, res) => {//call back function gets fired when we hit the request
  res.json(blockchain.chain)
})


app.post('/api/mine', (req, res) => {
  const { data } = req.body

  blockchain.addBlock({ data })

  pubsub.broadcastChain()

  res.redirect('/api/blocks')
})

const syncChains = () => {
  request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootChain = JSON.parse(body);

      console.log('replace chain on a sync with', rootChain);
      blockchain.replaceChain(rootChain);
    }
  });
};

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
    syncChains();
  }
});

