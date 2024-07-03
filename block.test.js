const Block = require('./block.js')
const {GENESIS_DATA} = require('./config');
const cryptoHash = require('./crypto-hash.js');

describe('Block', ()=>
{
const timestamp = 'a-date';
const lastHash = 'foo-hash';
const hash = 'bar-hash';
const data = ['blockchain', 'data'];
const block = new Block({timestamp, lastHash, hash, data})

it('has a timestamp, lastHash, hash, and a data property', ()=>{
    expect(block.timestamp).toEqual(timestamp)
    expect(block.lastHash).toEqual(lastHash);
    expect(block.hash).toEqual(hash);
    expect(block.data).toEqual(data);

})
})
describe('genesis()', () => {
    const genesisBlock = Block.genesis();

    it('returns a Block instance', () => {
      expect(genesisBlock instanceof Block).toBe(true);
    });

    it('returns the genesis data', () => {
      expect(genesisBlock).toEqual(GENESIS_DATA); 
    //In JavaScript, comparing an object literal directly to an instance of a class for equality using toEqual 
    //or similar methods generally involves matching all properties of the objects, including their values. 
    });

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
      expect(minedBlock instanceof Block).toBe(true);
    })

    it('sets the `lastHash` to be the `hash` of the lastBlock', () => {
      expect(minedBlock.lastHash).toEqual(lastBlock.hash)
    });

    it('sets the `data`', () => {
      expect(minedBlock.data).toEqual(data)
    });

    it('sets a `timestamp`', () => {
      expect(minedBlock.timestamp).not.toEqual(undefined)
    });

    it('creates a SHA-256 hash based on proper inputs',()=>
    {
    
     expect(minedBlock.hash).toEqual(cryptoHash(minedBlock.timestamp,lastBlock.hash,data))    
})

})
