// REALBLOCKS SECURITY REGISTRY DEMO
// Demonstrate registering multiple securities with trading symbols
// converting ERC20 into them, and distributing between multiple users
// using CLI tools.

require('module-alias/register')
const { Range, List } = require('immutable');
const BN = require('bn.js');

const transactions = require('../demo/src/transactions');
const notes        = require('../demo/src/notes');
const wallets      = require('../demo/src/wallets');
const web3         = require('../demo/web3Listener');
const keystore     = require('../demo/accounts');
const config       = require('../demo/config');
const erc20        = require('../demo/src/contracts/erc20Token');

const { erc20ScalingFactor: scalingFactor } = config;
const assert = require('chai').assert
const utils  = require('ethereumjs-utils')
const demo   = require('democracy.js')

const aztecBridgeContract = require('../demo/src/contracts/aztecToken')
const securityRegistry    = require('../demo/src/contracts/realBlocks/securityRegistry')

const deployNewBridge = require('../cli/deployNewBridge')
const writeWebOutputs = require('../cli/utils')

let accounts

const initTestWallets = async() => {
  accounts = keystore.keys.map(({ address }) => address);
  await Promise.all(accounts.map((acct) => { return wallets.init(acct) }))
})

const fundWallets = async() => {

  // Grant 0.5 ETH to all trading accounts just so we can run transactions
  const testAccounts = await web3.eth.getAccounts();

  const balance = await web3.eth.getBalance(testAccounts[0]);
  console.log(`Account balance: ${balance}`);

  await Promise.all(accounts.map((account) => {
    return web3.eth.sendTransaction({
      from: testAccounts[0],
      to: account,
      value: web3.utils.toWei('0.1', 'ether'),
    });
  }));
  console.log('Distributed 0.1 ETH initially to test wallets');
}

const mintAndApprove = async(tradeSymbol) => {
  const erc20Address = await erc20.getContractAddress(tradeSymbol);
  console.log(`minting 100 tokens ERC ${tradeSymbol} at ${erc20Address}`);
  await transactions.getTransactionReceipt(
    await erc20.mint(
      tradeSymbol,
      accounts[0],
      accounts[0],
      scalingFactor.mul(new BN(100)).toString(10)
    )
  );
  console.log('minted');

  const aztecBridgeContractAddress = await aztecBridgeContract.getContractAddress(tradeSymbol);
  console.log(`AZTECERC20Bridge ${tradeSymbol} at ${aztecBridgeContractAddress}`)
  console.log('approving aztecBridgeContract to spend 100 tokens owned by accounts[0]');
    await transactions.getTransactionReceipt(
        await erc20.approve(
            tradeSymbol,
            accounts[0],
            aztecBridgeContractAddress,
            scalingFactor.mul(new BN(100)).toString(10)
        )
  );
  console.log('approved')
}

const registerBridge = async (tradeSymbol) => {
  const aztecBridgeAddress = await aztecBridgeContract.getContractAddress(tradeSymbol);
  const erc20Address = await erc20.getContractAddress(tradeSymbol);
  assert(utils.isValidAddress(aztecBridgeAddress))
  assert(utils.isValidAddress(erc20Address))

  txHash = await securityRegistry.register(
    accounts[0], tradeSymbol, aztecBridgeAddress, erc20Address, scalingFactor.toString())
  await securityRegistry.updateRegisterTransaction(txHash);
}

const proofs = [];
const transactionHashes = [];

const issue = async (tradeSymbol, outputNoteList, publicWithdrawal) => {

  const aztecBridgeAddress = await aztecBridgeContract.getContractAddress(tradeSymbol)
  assert(utils.isValidAddress(aztecBridgeAddress))
  assert(List.isList(outputNoteList))
  assert(outputNoteList.count() > 0)
  assert(publicWithdrawal < 0)

  const noteSum = outputNoteList.reduce((sum, notePair) => {
    return sum + Number(notePair.get(1))
  }, 0)
  const outputNoteListJS = outputNoteList.map((notePair) => {
    return [demo.getAccountFromArg(accounts, notePair.get(0)), Number(notePair.get(1))]
  }).toJS()

  demo.print(
  assert.equal(-publicWithdrawal, noteSum,
               `Public withdrawal does not match sum of output notes.`) 
  console.log('issuing first join-split transaction');
  proofs[0] = await notes.createConfidentialTransfer(
        [],
        outputNoteListJS,
        publicWithdrawal,
        accounts[0],
        aztecBridgeAddress
    );
  transactionHashes[0] = await aztecBridgeContract.confidentialTransfer(
    accounts[0],
    tradeSymbol,
    proofs[0].proofData,
    proofs[0].m,
    proofs[0].challenge,
    proofs[0].inputSignatures,
    proofs[0].outputOwners,
    proofs[0].metadata
  );
  console.log('dispatched withdrawal join-split, waiting for receipt');

  await aztecBridgeContract.updateConfidentialTransferTransaction(transactionHashes[0]);

  console.log('withdrawal transaction mined.');
}

const firstJoinSplit = async (tradeSymbol) => {
  const aztecBridgeAddress = await aztecBridgeContract.getContractAddress(tradeSymbol);
  assert(utils.isValidAddress(aztecBridgeAddress))

  console.log('issuing first join-split transaction');
  proofs[0] = await notes.createConfidentialTransfer(
        [],
        [[accounts[0], 22], [accounts[0], 20], [accounts[1], 22], [accounts[2], 36]],
        -100,
        accounts[0],
        aztecBridgeAddress
    );
/*
    console.log(`sender ${accounts[0]}`);
    console.log(`proofData ${proofs[0].proofData}`);
    console.log(`m ${proofs[0].m}`);
    console.log(`challenge ${proofs[0].challenge}`);
    console.log(`inputSignatures ${proofs[0].inputSignatures}`);
    console.log(`outputOwners ${proofs[0].outputOwners}`);
    console.log(`metaData ${proofs[0].metadata}`);
    */
  transactionHashes[0] = await aztecBridgeContract.confidentialTransfer(
    accounts[0],
    tradeSymbol,
    proofs[0].proofData,
    proofs[0].m,
    proofs[0].challenge,
    proofs[0].inputSignatures,
    proofs[0].outputOwners,
    proofs[0].metadata
  );
  console.log('dispatched 1st join-split, waiting for receipt');

  await aztecBridgeContract.updateConfidentialTransferTransaction(transactionHashes[0]);

  console.log('first join-split transaction mined.');
}

const secondJoinSplit = async (tradeSymbol) => {

  const aztecBridgeAddress = await aztecBridgeContract.getContractAddress(tradeSymbol);
  assert(utils.isValidAddress(aztecBridgeAddress))

    console.log('issuing second join-split transaction');
    proofs[1] = await notes.createConfidentialTransfer(
        [proofs[0].noteHashes[0], proofs[0].noteHashes[2]],
        [[accounts[0], 30], [accounts[2], 14]],
        0,
        accounts[0],
        aztecBridgeAddress
    );

    console.log('sending transaction');
    transactionHashes[1] = await aztecBridgeContract.confidentialTransfer(
        accounts[0],
	tradeSymbol,
        proofs[1].proofData,
        proofs[1].m,
        proofs[1].challenge,
        proofs[1].inputSignatures,
        proofs[1].outputOwners,
        proofs[1].metadata
    );

    console.log('dispatched 2nd join-split, waiting for receipt');

    await aztecBridgeContract.updateConfidentialTransferTransaction(transactionHashes[1]);

    console.log('second join-split transaction mined');
}

const thirdJoinSplit = async (tradeSymbol) => {
  const aztecBridgeAddress = await aztecBridgeContract.getContractAddress(tradeSymbol);
  assert(utils.isValidAddress(aztecBridgeAddress))
    console.log('issuing third join-split transaction');
    proofs[2] = await notes.createConfidentialTransfer(
        [proofs[0].noteHashes[1], proofs[0].noteHashes[3]],
        [[accounts[0], 25], [accounts[2], 25]],
        6,
        accounts[1],
        aztecBridgeAddress
    );
    transactionHashes[2] = await aztecBridgeContract.confidentialTransfer(
        accounts[1],
        tradeSymbol,
        proofs[2].proofData,
        proofs[2].m,
        proofs[2].challenge,
        proofs[2].inputSignatures,
        proofs[2].outputOwners,
        proofs[2].metadata
    );

    console.log('dispatched 3rd join-split, waiting for receipt');
    await aztecBridgeContract.updateConfidentialTransferTransaction(transactionHashes[2]);

    console.log('third join-split transaction mined');
}

module.exports = {
  fundWallets    : fundWallets,
  mintAndApprove : mintAndApprove,
  registerBridge : registerBridge,
  firstJoinSplit : firstJoinSplit,
  secondJoinSplit: secondJoinSplit,
  thirdJoinSplit : thirdJoinSplit,
  issue          : issue,
}
