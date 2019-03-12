#!/usr/bin/env node

// ENCRYPTED ISSUANCE
// Tool for converting minted/approved ERC20 tokens to AZTEC notes

require('module-alias/register')
const { issue } = require('./components')
const config = require('../demo/config')
const { fromJS, print } = require('@democracy.js/utils')

const symbol = process.argv[2]
console.log(`SYMBOL ${symbol}`)

const outputNoteList = fromJS(JSON.parse(process.argv[3]))
console.log(`OUTPUT NOTE LIST`)
print(outputNoteList.toJS())

const publicWithdrawal = Number(process.argv[4])
console.log(`PUBLIC WITHDRAWAL ${publicWithdrawal}`)

issue(symbol, outputNoteList, publicWithdrawal)
