// REALBLOCKS SECURITY REGISTRY DEMO
// Demonstrate registering multiple securities with trading symbols
// converting ERC20 into them, and distributing between multiple users
// using CLI tools.

require('module-alias/register')
const { issue } = require('./components')
const config = require('../demo/config')

const symbol = process.argv[2]
console.log(`SYMBOL ${symbol}`)

const outputNoteList = fromJS(process.argv[3])
console.log(`OUTPUT NOTE LIST`)
demo.print(outputNoteList.toJS())

const publicWithdrawal = Number(process.argv[4])
console.log(`PUBLIC WITHDRAWAL ${publicWithdrawal}`)

issue(symbol, outputNoteList, publicWithdrawal)
