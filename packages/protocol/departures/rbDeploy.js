// A departure multi-deploy of two ERC20Mintables and AZTECERC20Bridge's,
// for trading symbols AAA and BBB
const DEPARTURE_NAME='Private Trading AAA & BBB Multi-Deploy'

const demo = require('democracy.js')
const path = require('path')
const { t2 } = require('@aztec/dev-utils').constants
const BN = require('bn.js')
const { erc20ScalingFactor } = require('../demo/config')
const { Map, List } = require('immutable')
const assert = require('chai').assert

eth = demo.getNetwork('test')

let compiles = List([])
let links    = List([])
let deploys  = List([])

depart = async () => {

  networkId = await eth.net_version()

  if (!demo.getContract('RBSecurityRegistry')) {
    await demo.compile('contracts', 'RBSecurityRegistry.sol')
    compiles = compiles.push('RBSecurityRegistry')
  }

  if (!demo.getLink(networkId, 'AZTEC-linkAZ')) {
    const link = await demo.link('AZTEC', 'test', 'account0', 'linkAZ')
    links = links.push(link)
  }
  if (!demo.getDeploy(networkId, 'AZTEC-deployAZ')) {
    const deploy = await demo.deploy('AZTEC', 'test', 'linkAZ', 'deployAZ')
    deploys = deploys.push(deploy)
  }
  
  if (!demo.getLink(networkId, 'AZTECInterface-link')) {
    const link = await demo.link('AZTECInterface', 'test', 'account0', 'link')
    links = links.push(link)
  }
  
  if (!demo.getLink(networkId, 'RBSecurityRegistry-link')) {
    const link = await demo.link('RBSecurityRegistry', 'test', 'account0', 'link','AZTEC=deployAZ')
    links = links.push(link)
  }
  
  //let deploySR
  //if (!(deploySR = demo.getDeploy(networkId, 'RBSecurityRegistry-deploy'))) {
  let deploySR = await demo.deploy('RBSecurityRegistry', 'test', 'link', 'deploy',
      new Map ({ '_setupPubKey': t2,
                 '_chainId'    : networkId
      }))
  //}
  deploys = deploys.push(deploySR)

  return {
    'deploys': Map(deploys.map((dep) => {return [`${dep.get('name')}-${dep.get('deployId')}`, dep]}))
  }
}

clean = async() => {
  // Disable cleaning compiles for now for speed
  // But any Solidity contract changes will need a manual re-compile.
  //compiles.forEach(async (compile) => { await demo.cleanCompileSync(compile) })
  links.forEach(async (link) => { await demo.cleanLinkSync(networkId, link) })
  deploys.forEach(async (deploy) => { await demo.cleanDeploySync(networkId, deploy) } )
}

module.exports = {
  depart: depart,
  clean : clean
}

if (process.env['NODE_ENV'] === 'DEVELOPMENT') {
  depart().then((value) => {
    console.log(`Now departing: ${DEPARTURE_NAME}`)
    demo.print(value)
  }).then(() => {
    if (process.argv[2] === 'clean') {
      console.log(`Now cleaning: ${DEPARTURE_NAME}`)
    }
  })
}
