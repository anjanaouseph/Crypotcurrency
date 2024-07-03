const {GENESIS_DATA} = require('./config')
const cryptoHash = require('./crypto-hash')

class block 
{
    constructor({timestamp, lastHash, hash, data})
    {
        this.timestamp = timestamp
        this.lastHash = lastHash
        this.hash = hash
        this.data = data

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
        const timestamp = Date.now()
        const lastHash = lastBlock.hash

        return new this ({
            timestamp,
            lastHash,
            data,
            hash : cryptoHash(timestamp,lastHash,data)
        })
    }
    
}

module.exports = block