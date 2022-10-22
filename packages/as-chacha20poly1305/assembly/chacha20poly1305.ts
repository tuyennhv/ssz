import {
  chacha20InputPtr,
  chacha20KeyPtr,
  chacha20CounterPtr,
  CHACHA20_COUNTER_LENGTH,
  chacha20Stream,
  chacha20StreamXORUpdate,
  chacha20OutputPtr,
} from "./chacha20";
import {DATA_CHUNK_LENGTH, KEY_LENGTH, TAG_LENGTH} from "./const";
import {
  poly1305Digest,
  poly1305Init,
  poly1305InputPtr,
  poly1305KeyPtr,
  poly1305Update,
} from "./poly1305";
import {load8, store8, writeUint64LE} from "./util";

// cp stands for chacha20poly1305
const cpKeyArr = new Uint8Array(KEY_LENGTH);
export const cpKey = cpKeyArr.buffer;
// Right now js-libp2p-noise always use 12 bytes of nonce
// TODO: support 16 bytes nonce as in the protocol
const cpNonceArr = new Uint8Array(12);
export const cpNonce = cpNonceArr.buffer;
// As the need of js-libp2p-noise, only support an associatedData of 0 or 32 bytes
const cpAssociatedDataArr = new Uint8Array(32);
export const cpAssociatedData = cpAssociatedDataArr.buffer;
// cpSealed + cpTag = sealed in stablelib open() method
const cpInputArr = new Uint8Array(DATA_CHUNK_LENGTH);
export const cpInput = cpInputArr.buffer;
// TODO: remove this hard coded value
const cpTagArr = new Uint8Array(TAG_LENGTH);
export const cpTag = cpTagArr.buffer;

// to debug
const debugArr = new Uint32Array(64);
export const debug = debugArr.buffer;

/**
 * Initialize chacha20 and poly1305.
 * key and nonce and associatedData (if needed) should be set before this call
 * validation is done at javascript side.
 * @param asDataLength length of associatedData
 */
export function init(asDataLength: u32): void {
  doInit(cpKeyArr, cpNonceArr, asDataLength);
}

/**
 * Call init before this openUpdate.
 * Instead of calling _authenticate() then streamXOR() we do both at the same time chunk by chunk.
 * Note that tag data is not part of cpInputArr
 * @param dataLength length of cpInputArr
 */
export function openUpdate(dataLength: u32): void {
  doOpenUpdate(cpInputArr, dataLength);
}

/**
 * Similar to openUpdate but we do it reversely.
 * @param dataLength length of cpInputArr
 */
export function sealUpdate(dataLength: u32): void {
  doSealUpdate(cpInputArr, dataLength);
}

/**
 * Authenticate the sealed data, result could be known even before this call.
 * @param ciphertextLength = sealed - tag length
 * @return true if authenticate successfully, false otherwise
 */
export function digest(ciphertextLength: u32, asDataLength: u32): void {
  doDigest(ciphertextLength, asDataLength);
}

function doInit(key: Uint8Array, nonce: Uint8Array, asDataLength: u32): void {
  for (let i = 0; i < KEY_LENGTH; i++) {
    store8(chacha20KeyPtr, i, key[i]);
  }

  // Same to
  // const counter = new Uint8Array(16);
  // counter.set(nonce, counter.length - nonce.length);
  for (let i = 0; i < 4; i++) {
    store8(chacha20CounterPtr, i, 0);
  }
  for (let i = 4; i < CHACHA20_COUNTER_LENGTH; i++) {
    store8(chacha20CounterPtr, i, nonce[i - 4]);
  }

  // Generate authentication key by taking first 32-bytes of stream.
  // output is set to chacha20OutputPtr
  chacha20Stream(KEY_LENGTH);

  // part of _authenticate
  // Initialize Poly1305 with authKey.
  for (let i = 0; i < KEY_LENGTH; i++) {
    store8(poly1305KeyPtr, i, load8(chacha20OutputPtr, i));
  }
  poly1305Init();

  if (asDataLength > 0) {
    for (let i: u32 = 0; i < asDataLength; i++) {
      store8(poly1305InputPtr, i, cpAssociatedDataArr[i]);
    }
    poly1305Update(asDataLength);
    // h.update(ZEROS.subarray(ciphertext.length % 16));
    if (asDataLength % 16 > 0) {
      const paddedLength = 16 - (asDataLength % 16);
      if (paddedLength > 0) {
        for (let i: i32 = 0; i < paddedLength; i++) {
          store8(poly1305InputPtr, i, 0);
        }
        poly1305Update(paddedLength);
      }
    }
  }
}

function doOpenUpdate(ciphertext: Uint8Array, length: u32): void {
  // part of _authenticate
  // no need to initialize Poly1305 anymore as we did it in doInit()
  for (let i: u32 = 0; i < length; i++) {
    store8(poly1305InputPtr, i, ciphertext[i]);
  }
  poly1305Update(length);

  // part of open()
  // Decrypt even through we haven't done _authenticate
  // we may waste some streamXOR() call but should be ok for most of the times
  // key and counter are set in doInit
  // TODO: chain with the above for loop?
  for (let i: u32 = 0; i < length; i++) {
    store8(chacha20InputPtr, i, ciphertext[i]);
  }
  chacha20StreamXORUpdate(length);
  // output is set to chacha20Output
}

function doSealUpdate(plaintext: Uint8Array, length: u32): void {
  for (let i: u32 = 0; i < length; i++) {
    store8(chacha20InputPtr, i, plaintext[i]);
  }
  // output is set to chacha20Output
  chacha20StreamXORUpdate(length);

  // part of _authenticate
  // no need to initialize Poly1305 anymore as we did it in doInit()
  for (let i: u32 = 0; i < length; i++) {
    store8(poly1305InputPtr, i, load8(chacha20OutputPtr, i));
  }
  poly1305Update(length);
}

function doDigest(ciphertextLength: u32, asDataLength: u32): void {
  // h.update(ZEROS.subarray(ciphertext.length % 16));
  if (ciphertextLength % 16 > 0) {
    const paddedLength = 16 - (ciphertextLength % 16);
    if (paddedLength > 0) {
      for (let i: i32 = 0; i < paddedLength; i++) {
        store8(poly1305InputPtr, i, 0);
      }
      poly1305Update(paddedLength);
    }
  }

  // part of _authenticate
  writeUint64LE(asDataLength, poly1305InputPtr);
  poly1305Update(8);
  writeUint64LE(ciphertextLength, poly1305InputPtr);
  poly1305Update(8);

  poly1305Digest();
}
