//npm run test

const Block = require('./block.js')
const {GENESIS_DATA, MINE_RATE} = require('../config.js')
const {cryptoHash} = require('../util')
const hexToBinary = require('hex-to-binary');

describe('Block', ()=>
{
const timestamp = 2000
const lastHash = 'foo-hash'
const hash = 'bar-hash'
const data = ['blockchain', 'data']
const nonce = 1
const difficulty = 1
const block = new Block({timestamp, lastHash, hash, data, nonce, difficulty})

it('has a timestamp, lastHash, hash, and a data property', ()=>{
    expect(block.timestamp).toEqual(timestamp)
    expect(block.lastHash).toEqual(lastHash)
    expect(block.hash).toEqual(hash)
    expect(block.data).toEqual(data)
    expect(block.nonce).toEqual(nonce)
    expect(block.difficulty).toEqual(difficulty)
})

describe('genesis()', () => {
    const genesisBlock = Block.genesis()

    it('returns a Block instance', () => {
      expect(genesisBlock instanceof Block).toBe(true)
    })

    it('returns the genesis data', () => {
      expect(genesisBlock).toEqual(GENESIS_DATA) 
    //In JavaScript, comparing an object literal directly to an instance of a class for equality using toEqual 
    //or similar methods generally involves matching all properties of the objects, including their values. 
    })

//JavaScript implements classes as objects under the hood.

// So an instance of the block class with Genesis data is essentially that Genesis data object itself because

// it's going to have the same properties, meaning it will have those same keys and values of the timestamp,

// the last hash, the hash and the data.
  })

  describe("mine block", ()=>
{
    const lastBlock = Block.genesis()
    const data = 'mined data'
    const minedBlock = Block.minedBlock({ lastBlock, data }) //you pass an object that must have data and lastBlock properties

    it('returns a Block instance', () => {
      expect(minedBlock instanceof Block).toBe(true)
    })

    it('sets the `lastHash` to be the `hash` of the lastBlock', () => {
      expect(minedBlock.lastHash).toEqual(lastBlock.hash)
    })

    it('sets the `data`', () => {
      expect(minedBlock.data).toEqual(data)
    })

    it('sets a `timestamp`', () => {
      expect(minedBlock.timestamp).not.toEqual(undefined)
    })

    it('creates a SHA-256 hash based on proper inputs',()=>
    {
     expect(minedBlock.hash).toEqual(cryptoHash(minedBlock.timestamp,minedBlock.nonce,minedBlock.difficulty,lastBlock.hash,data))    
    })

    it('sets a `hash` that matches the difficulty criteria',()=>
    {
      expect(hexToBinary(minedBlock.hash).substring(0, minedBlock.difficulty))
      .toEqual('0'.repeat(minedBlock.difficulty));  
    })

    it('adjusts the difficulty', () => {
      const possibleResults = [lastBlock.difficulty+1, lastBlock.difficulty-1];

      expect(possibleResults.includes(minedBlock.difficulty)).toBe(true);
    });

})
describe('adjustDifficulty()', () => {
  it('raises the difficulty for a quickly mined block', () => {
    expect(Block.adjustDifficulty({ //difficulty doesnt need to be on a specific instance of the block so use it in static
      //context
      originalBlock: block,
      timestamp: block.timestamp + MINE_RATE - 100
    })).toEqual(block.difficulty+1);
  });

  it('lowers the difficulty for a slowly mined block', () => {
    expect(Block.adjustDifficulty({
      originalBlock: block,
      timestamp: block.timestamp + MINE_RATE + 100
    })).toEqual(block.difficulty-1)
  })
  it('has a lower limit of 1', () => {
    block.difficulty = -1;

    expect(Block.adjustDifficulty({ originalBlock: block })).toEqual(1);
  });
})
})
