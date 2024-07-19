const Blockchain = require('../blockchain/index');

const blockchain = new Blockchain();

blockchain.addBlock({ data: 'initial' });

console.log('first block', blockchain.chain[blockchain.chain.length-1]);

let prevTimestamp, nextTimestamp, nextBlock, timeDiff, average;

const times = [];

for (let i=0; i<10000; i++) {
  prevTimestamp = blockchain.chain[blockchain.chain.length-1].timestamp;

  blockchain.addBlock({ data: `block: ${i}` });

  nextBlock = blockchain.chain[blockchain.chain.length-1];

  nextTimestamp = nextBlock.timestamp;
  timeDiff = nextTimestamp - prevTimestamp;
  times.push(timeDiff);

  average = times.reduce((total, num) => (total + num))/times.length;//reduce array to a single value stored in total.
//2 params total and num. Values are added to the total in every iteration.
//NodeJS and the operating system is just a little too powerful because of our leading zeros implementation.
//The difficulty gets to a low requirement.
//Too often values of 2 or 3 are quite low for a number of leading zeros.
//This, in addition to the relatively low mine rate, gives the CPU many chances to discover a valid hash very quickly.

  console.log(`Time to mine block: ${timeDiff}ms. Difficulty: ${nextBlock.difficulty}. Average time: ${average}ms`);
}