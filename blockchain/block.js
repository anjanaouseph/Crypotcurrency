const hexToBinary = require('hex-to-binary');
// Ideally, we would have wanted to see the average time hover around the set mine rate of 1000.
// So perhaps a more fine grained system for the difficulty adjustment could give us the help that we need.
// And a system that uses leading zero bits with binary hashes instead of the current hexadecimal.
// Hash could potentially offer that.
// So let's do a leading zero bit implementation with binary hashes.
// Bitcoin uses a leading zero bits check on binary hashes, which offers a more fine grained difficulty
// adjustment.We have a hexa binary implementation which allows us to check for leading zero bits of the binary version
// of the hash, making it so that our difficulty adjustment is much more fine grained and therefore it's
// close to hitting that 1000 millisecond value of the set mine rate.

const {GENESIS_DATA, MINE_RATE} = require('../config')
const {cryptoHash} = require('../util/')

class block 
{
    constructor({timestamp, lastHash, hash, data, nonce, difficulty})
    {
        this.timestamp = timestamp
        this.lastHash = lastHash
        this.hash = hash
        this.data = data
        this.nonce = nonce
        this.difficulty = difficulty

    }

    static genesis() //Static methods are called on the class itself, not on instances of the class. 
    {
        return new this(GENESIS_DATA);
    }
    
    //factory method for 
    // Factory methods in programming refer to any functions that create without calling the constructor 
    //directly from outside the class. Instead, these methods use the class's constructor internally
    // In this case, we have a static function that is creating a new block on the behalf of whoever calls
    // Genesis.

    static minedBlock({data,lastBlock})
    // By using { data, lastBlock } in the function parameters, the method is set up to expect an object that has at 
    // least these two properties: data and lastBlock. This allows the function to extract these values directly from an object passed to it 
    // without having to reference the object itself inside the function. 
    {
        let hash, timestamp
        const lastHash = lastBlock.hash
        let {difficulty} = lastBlock
        let nonce = 0   

        do{
            nonce++
            timestamp = Date.now()
            difficulty = block.adjustDifficulty({ originalBlock: lastBlock, timestamp });
            hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty)
        }while(hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty))

        return new this ({
            timestamp,
            lastHash,
            data,
            difficulty,
            nonce,
            hash
        })
    }
    
    static adjustDifficulty({ originalBlock, timestamp }) {
        const { difficulty } = originalBlock;

        if (difficulty < 1) return 1;
    
        if ((timestamp - originalBlock.timestamp) > MINE_RATE) return difficulty - 1;
    
        return difficulty + 1;
      }
}

module.exports = block