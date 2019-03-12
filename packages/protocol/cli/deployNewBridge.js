require('module-alias/register')
const demo = require('democracy.js')
const { t2, ERC20_SCALING_FACTOR } = require('@aztec/dev-utils').constants;
const { Map, List } = require('immutable')
const assert = require('chai').assert

eth = demo.getNetwork('test')

deployNewBridge = async (tradeSymbol) => {
  console.log(`Deploying New Bridge/Token ${tradeSymbol}`)
  networkId = await eth.net_version()
  if (!demo.getContract('AZTECERC20Bridge')) {
    await demo.compile('contracts', 'AZTECERC20Bridge.sol')
  }
  if (!demo.getContract('ERC20Mintable')) {
    await demo.compile('contracts', 'ERC20Mintable.sol')
  }

  if (!demo.getLink(networkId, 'AZTEC-linkAZ')) {
    await demo.link('AZTEC','test','account0','linkAZ')
  }
  if (!demo.getDeploy(networkId, 'AZTEC-deployAZ')) {
    await demo.deploy('AZTEC','test','linkAZ','deployAZ')
  }

  if (!demo.getLink(networkId, 'ERC20Mintable-linkERC')) {
    await demo.link('ERC20Mintable', 'test', 'account0', 'linkERC')
  }

  let deployERC = await demo.getDeploy(networkId, `ERC20Mintable-deployERC_${tradeSymbol}`)
  if (!deployERC) {
    deployERC = await demo.deploy('ERC20Mintable', 'test', 'linkERC', `deployERC_${tradeSymbol}`)
  }
  assert(demo.isDeploy(deployERC))
	
  if (!demo.getLink(networkId, 'AZTECERC20Bridge-linkBr')) {
    await demo.link('AZTECERC20Bridge','test','account0','linkBr','AZTEC=deployAZ')
  }
  if (!demo.getDeploy(networkId, `AZTECERC20Bridge-deploy${tradeSymbol}`)) {
    await demo.deploy('AZTECERC20Bridge','test','linkBr',`deploy${tradeSymbol}`,
      new Map ({ '_setupPubKey' : t2, '_token' : deployERC.get('deployAddress'),
            '_scalingFactor' : ERC20_SCALING_FACTOR , '_chainId' : networkId }) )
  }
}

module.exports = deployNewBridge

if (require.main === module) {
  if (process.env['NODE_ENV'] === 'MAINNET') {
    console.error("We don't yet support this on the mainnet.")
  } else {
    assert.typeOf(process.argv[2], 'string', `Usage: ${process.arv} [tradeSymbol]`)
    deployNewBridge(process.argv[2]).then(() => { })
  }
}
