/**
 * Exposes an interface to create AZTEC notes and construct AZTEC zero-knowledge proofs
 *
 * @module notesController
 */

const aztec = require('aztec.js');
const db = require('./db');

const { NOTE_STATUS } = require('../../config');
const wallets = require('../wallets');

const { setImmutableKey, getImmutableKey, Logger } = require('@democracy.js/utils')
const LOGGER = new Logger('notesController')
const util = require('ethereumjs-util')
const assert = require('chai').assert

const noteController = {};

noteController.constructKey = (noteHash, ownerAddress, status, aztecTokenAddress) => {
    assert(util.isValidAddress(ownerAddress))
    assert(util.isValidAddress(aztecTokenAddress))
    assert.notEqual(ownerAddress, aztecTokenAddress)
    assert.notEqual(['offchain','unspent','spent'].indexOf(status), -1)
    return `/notes/${ownerAddress}/${aztecTokenAddress}/${status}/${noteHash}`
}

/**
 * Get a transaction by its note hash
 * @method get
 * @param {string} noteHash the keccak256 hash of the note coordinates
 * @returns {Object} the note object
 */
noteController.get = (noteHash, bridgeAddress) => {
    assert(util.isValidAddress(bridgeAddress))
    const rawNote = db.get(noteHash);
    if (!rawNote) {
        throw new Error(`could not find note at ${noteHash}`);
    }
    return {
        note: aztec.note.fromViewKey(rawNote.viewingKey),
        ...rawNote,
    };
};

/**
 * Create an AZTEC note. Wallet database must know note owner's public key
 * @method createNote
 * @param {string} owner the hex-formatted Ethereum address of note owner
 * @param {number} value the value of the note
 * @returns {Object} the note object
 */
noteController.createNote = (owner, value, bridgeAddress) => {
    assert(util.isValidAddress(owner))
    //assert(util.isValidAddress(bridgeAddress))
    const wallet = wallets.get(owner);
    const note = aztec.note.create(wallet.publicKey, value);
    const exported = {
        ...note.exportNote(),
        owner,
        status: NOTE_STATUS.OFF_CHAIN,
    };
    const key = constructKey(
    const key = `/notes/${owner}/${bridgeAddress}/offchain/${exported.noteHash}`
    LOGGER.info('createNote', key, exported)
    //setImmutableKey(key, exported)
    db.create(exported);
    return note;
};

/**
 * Set an AZTEC note's status to one of {@link module:config.NOTE_STATUS}
 * @method createNote
 * @param {string} noteHash the keccak256 hash of the note coordinates
 * @param {@module:config.NOTE_STATUS} status the new status of the note
 * @returns {Object} the updated note object
 */
noteController.setNoteStatus = (noteHash, status) => {
    if (!NOTE_STATUS[status]) {
        throw new Error(`status ${status} is not a valid AZTEC note status`);
    }
    const note = db.get(noteHash);
    return db.update(noteHash, {
        ...note,
        status,
    });
};

noteController.setUnspent = (noteHash, ownerAddress, aztecTokenAddress) => {
    const key = 
  

/**
 * Construct a hex-formatted string containing the ephemeral keys for an array of notes.  
 *   The ephemeral key can be used by a note's owner to recover the viewing key
 * @method encodeMetadata
 * @param {Array} noteArray an array of AZTEC notes
 * @returns {string} the hex-formatted string concatenation of the compressed ephemeral keys
 */
noteController.encodeMetadata = (noteArray) => {
    return aztec.note.encodeMetadata(noteArray);
};

/**
 * @typedef {Object} Proof
 * @property {string[]} proofData The zero-knowledge proof data
 * @property {string} m The number of input notes (abi encoded to a 32-byte string)
 * @property {string} challenge The zero-knowledge proof challenge variable
 * @property {string[]} inputSignatures ECDSA signatures for every input note, signed by the note owner
 * @property {string[]} outputOwners The Ethereum addresses of the owners of each output note
 * @property {string} metadata The metadata required for note owners to recover their viewing key
 * @property {string[]} noteHashes Array of the hashes of the notes used in this proof
 */

/**
 * Construct a confidentialTransfer AZTEC zero-knowledge proof.
 * @method createConfidentialTransfer
 * @param {string[]} inputNoteHashes array of the hashes of the input notes
 * @param {Object[]} outputNoteData array of output note data
 * @param {string} outputNoteData[].owner Ethereum address of the output note owner
 * @param {number} outputNoteData[].value the value of the output note
 * @param {number} v the 'public commitment' - the number of tokens being converted into/out of AZTEC note form
 * @param {string} senderAddress the Ethereum address of the transaction sender
 * @param {string} aztecTokenAddress the Ethereum address of the AZTEC token smart contract
 * @returns {module:notesController~Proof} The zero-knowledge proof data required to broadcast an AZTEC transaction
 */
noteController.createConfidentialTransfer = async (inputNoteHashes, outputNoteData, v, senderAddress, aztecTokenAddress) => {
    const inputNotes = inputNoteHashes.map(noteHash => noteController.get(noteHash, ownerAddress, aztecTokenAddress));
    const outputNotes = outputNoteData.map(([owner, value]) => noteController.createNote(owner, value, aztecTokenAddress));
    const m = inputNotes.length;
    const noteData = [...inputNotes.map(n => n.note), ...outputNotes];

    const { proofData, challenge } = aztec.proof.joinSplit.constructJoinSplit(noteData, m, senderAddress, v);
    const metadata = noteController.encodeMetadata(inputNotes.map(n => n.note));

    const outputOwners = outputNoteData.map(([owner]) => owner);

    const inputSignatures = inputNotes.map((inputNote, index) => {
        const { owner } = inputNote;
        const wallet = wallets.get(owner);
        return aztec.sign.signNote(proofData[index], challenge, senderAddress, aztecTokenAddress, wallet.privateKey);
    });

    const noteHashes = noteData.map(n => n.noteHash);

    return {
        proofData,
        m,
        challenge,
        inputSignatures,
        outputOwners,
        metadata,
        noteHashes,
    };
};

module.exports = noteController;
