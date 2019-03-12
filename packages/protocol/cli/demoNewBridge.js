// REALBLOCKS SECURITY REGISTRY DEMO
// Demonstrate registering multiple securities with trading symbols
// converting ERC20 into them, and distributing between multiple users
// using CLI tools.

require('module-alias/register')
const { firstJoinSplit } = require('./components')
const config = require('../demo/config')

const symbol = process.argv[2]
console.log(`SYMBOL ${symbol}`)

async function demoRegistry() {
  //await fundWallets()

  // Deploy a fresh security registry so we get an empty symbol list every time
  //deploySecurityRegistry(deployer, deployer.networkId);

  await firstJoinSplit(symbol)
}

demoRegistry().then((value) => { console.log(value) })
