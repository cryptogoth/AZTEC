const fs = require('fs')
const { OrderedMap } = require('immutable')

const demo = require('democracy.js')
const assert = require('chai').assert

const writeWebOutputs = async(eth) => {
  const networkId = await eth.net_version()
  const deploys = demo.getDeploys(networkId)
  const outputs = {}
  deploys.map((deploy, deployName) => {
    assert(demo.isDeploy(deploy))
    abi = deploy.get('abi').toJS()
    address = deploy.get('deployAddress')

    console.log(`Writing web outputs for ${deployName} at address ${address}`)

    const output = {
      address: address,
      abi: abi
    }

    outputs[deployName] = output

  })

  fs.writeFileSync(`./web/contractOutputs.js`,
                 `contractOutputs=${JSON.stringify(outputs, null, '  ')}`)
}

module.exports = writeWebOutputs
