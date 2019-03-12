/**
 * Exposes an interface to broadcast AZTEC zero-knowledge confidential transactions to an AZTEC token
 *
 * @module aztecTokenController
 */

//require('module-alias/register');
const web3Utils = require('web3-utils');

const { List } = require('immutable');
const db = require('../../../db');
const deployer = require('../../../deployer');
const noteController = require('../../notes');
const wallets = require('../../wallets');
const transactions = require('../../transactions');
const { TX_TYPES, NOTE_STATUS } = require('../../../config');

//const AZTECERC20Bridge = require('../../../../build/contracts/AZTECERC20Bridge.json');
//const RBSecurityRegistry = require('../../../../build/contracts/RBSecurityRegistry.json');

const { web3 } = deployer;
const { padLeft } = web3Utils;

const securityRegistry = {};

const demo = require('democracy.js')
const assert = require('chai').assert

securityRegistry.getDeploy = async () => {
    const networkId = await deployer.getNetwork();
    const deploy = demo.getDeploy(networkId, 'RBSecurityRegistry-deploy')
    assert(demo.isDeploy(deploy))
    return deploy
}

/**
 * Get the RBSecurityRegistry.sol contract address
 * @method getContractAddress
 * @returns {string} the contract address
 */
securityRegistry.getContractAddress = async () => {
    const deploy = await securityRegistry.getDeploy()
    return deploy.get('deployAddress')
/*
    if (!RBSecurityRegistry.networks[networkId] || !RBSecurityRegistry.networks[networkId].address) {
        throw new Error(`RBSecurityRegistry.sol not deployed to network ${networkId}`);
    }
    return RBSecurityRegistry.networks[networkId].address;
*/
};

/**
 * Register a trading symbol bound to a newly instantiated bridge contract
 * @method register
 * @param {string} address the spending address of the deployer
 * @param {string} tradingSymbol the short display name for this security
 * @param {string} challenge AZTEC zero-knowledge proof challenge variable
 * @param {string[]} inputSignatures ECDSA signature for each input note
 * @param {string[]} outputOwners Ethereum address of each output note owner
 * @param {string} metadata ephemeral key metadata, used by note owners to recover viewing key
 * @returns {string} the broadcast transaction's transaction hash.
 */
securityRegistry.register = async (address, tradingSymbol, existingContract, erc20Address, scalingFactor) => {
    const wallet = wallets.get(address);
    const deploy = await securityRegistry.getDeploy()
    const contractAddress = deploy.get('deployAddress')
    const abi = deploy.get('abi').toJS()
    const securityRegistryContract = new web3.eth.Contract(abi, contractAddress);
    securityRegistryContract.contractAddress = contractAddress;
    const transactionHash = await deployer.methodCall(
        [tradingSymbol, existingContract],
        {
            contract: securityRegistryContract,
            method: 'register',
            wallet,
        }
    );

    // add transaction
    //transactions.newTransaction(TX_TYPES.AZTEC_TOKEN_CONFIDENTIAL_TRANSFER, transactionHash);

    return transactionHash;
};

/**
 *
 */
securityRegistry.getSymbolList = async (address) => {
    const deploy = await securityRegistry.getDeploy()
    const contractAddress = deploy.get('deployAddress')
    const abi = deploy.get('abi').toJS()
    const instance = new web3.eth.Contract(abi, contractAddress)
    const SYMBOL_COUNT = await securityRegistry.getSymbolCount(instance);
    function listPromiseHelper(listSoFar) {
   	if (listSoFar.count() + 1 > SYMBOL_COUNT) { return listSoFar }
        return new Promise((resolve,reject) => {
            //console.log(`methods ${JSON.stringify(instance, null, "  ")}`);
            instance.methods['symbolList'](listSoFar.count()).call({from: address},
            function(error, result) {
                if (error) {
	            reject(error);
                }
	        if (result === undefined) { resolve(listSoFar) }
	        else { resolve(listPromiseHelper(listSoFar.push(result))) }
            })
      });
    }
    return listPromiseHelper(List([]));
}

/**
 * Get the mined result of a register transaction.
 *   Adds the transactionReceipt and transaction objects into the transaction's database entry.
 *   This might be useful later if we need to update any local client state
 *   for representations of AZTECERC20Bridge contracts.
 * @method updateRegisterTransaction
 * @param {string} transactionHash the transaction hash
 */
securityRegistry.updateRegisterTransaction = async (transactionHash) => {
    const transactionReceipt = await deployer.getTransactionReceipt(transactionHash);

    const transactionData = await deployer.getTransaction(transactionHash);

    transactions.updateMinedTransaction(transactionHash, transactionReceipt, transactionData);
};

/**
 * Get the web3 contract object
 * @method contract
 * @returns {Object} the web3 contract
 */
securityRegistry.contract = (contractAddress) => {
    return new web3.eth.Contract(RBSecurityRegistry.abi, contractAddress);
};

securityRegistry.getSymbolCount = async () => {
    const deploy = await securityRegistry.getDeploy();
    const abi = deploy.get('abi').toJS()
    const contractAddress = await securityRegistry.getContractAddress();
    const instance = new web3.eth.Contract(abi, contractAddress)
    return new Promise((resolve, reject) => {
        instance.methods['getSymbolCount']().call({},
            function(error, result) {
	              if (error) { reject(error) }
                console.log(`SYMBOL COUNT ${JSON.stringify(result)}`)
                resolve(Number(result['symbolCount']));
            })
    })
}	    
    
module.exports = securityRegistry;
