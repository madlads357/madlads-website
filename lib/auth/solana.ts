// What the server checks for the wallet login, with @solana/kit (server-only):
//   - a Sign In With Solana message, signed as plain text or wrapped in a version 1 offchain message
//     (how hardware wallets such as a Ledger sign it);
//   - the fallback for Ledgers whose wallet can't do offchain sign-in: a legacy transaction with one
//     memo instruction, signed but never sent.
import {
  address,
  appendTransactionMessageInstruction,
  blockhash,
  compileTransaction,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  getCompiledTransactionMessageDecoder,
  getOffchainMessageDecoder,
  getPublicKeyFromAddress,
  getTransactionDecoder,
  getUtf8Decoder,
  getUtf8Encoder,
  isAddress,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  verifySignature,
  type Address,
  type SignatureBytes,
} from "@solana/kit";
import { parseSignInText, type SignInFields } from "./siws";

export const isSolanaAddress = (a: unknown): a is Address => typeof a === "string" && isAddress(a);

const MEMO_PROGRAM = address("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const OFFCHAIN_PREFIX = Uint8Array.from([0xff, ...getUtf8Encoder().encode("solana offchain")]); // the offchain message signing domain

async function signedBy(signer: Address, signature: Uint8Array, data: Uint8Array) {
  if (signature.length !== 64) return false;
  try {
    return await verifySignature(await getPublicKeyFromAddress(signer), signature as SignatureBytes, data);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------ Sign In With Solana */

// The SIWS fields the wallet signed, if the signature is valid. signedMessage is either the SIWS
// text itself or a version 1 offchain message carrying it, whose only required signer must be the
// account in the text. The caller then checks the fields (domain, nonce, dates…).
export async function readSignIn(signedMessage: Uint8Array, signature: Uint8Array): Promise<SignInFields | null> {
  let text: string;
  let offchainSigner: string | null = null;
  const isOffchain = signedMessage.length > OFFCHAIN_PREFIX.length && OFFCHAIN_PREFIX.every((b, i) => signedMessage[i] === b);
  if (isOffchain) {
    try {
      const message = getOffchainMessageDecoder().decode(signedMessage);
      if (message.version !== 1 || message.requiredSignatories.length !== 1) return null;
      text = message.content;
      offchainSigner = message.requiredSignatories[0].address;
    } catch {
      return null;
    }
  } else {
    text = getUtf8Decoder().decode(signedMessage);
  }
  const fields = parseSignInText(text);
  if (!fields || !isSolanaAddress(fields.address)) return null;
  if (offchainSigner !== null && offchainSigner !== fields.address) return null;
  return (await signedBy(fields.address, signature, signedMessage)) ? fields : null;
}

/* ------------------------------------------------------------ memo transaction (Ledger fallback) */

// An unsigned legacy transaction paid by `payer`, with one memo instruction carrying `memo`.
// Legacy on purpose: it is only signed, never sent, and every wallet and Ledger app can sign it.
export function memoTransaction(payer: Address, memo: string, recentBlockhash: string): string {
  const message = pipe(
    createTransactionMessage({ version: "legacy" }),
    (m) => setTransactionMessageFeePayer(payer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash({ blockhash: blockhash(recentBlockhash), lastValidBlockHeight: 0n }, m),
    (m) => appendTransactionMessageInstruction({ programAddress: MEMO_PROGRAM, data: getUtf8Encoder().encode(memo) }, m),
  );
  return getBase64EncodedWireTransaction(compileTransaction(message));
}

// Did `payer` sign a transaction it pays for, with a memo instruction carrying exactly `memo`?
// The wallet may have changed the transaction (some add a priority fee), so we check its content
// rather than compare bytes.
export async function signedMemo(wireTransaction: Uint8Array, payer: Address, memo: string): Promise<boolean> {
  try {
    const tx = getTransactionDecoder().decode(wireTransaction);
    const signature = tx.signatures[payer];
    if (!signature) return false;
    const message = getCompiledTransactionMessageDecoder().decode(tx.messageBytes);
    if (message.staticAccounts[0] !== payer) return false;
    if (message.version === 1) return false; // we built a legacy transaction; v1 lays instructions out differently
    const hasMemo = message.instructions.some(
      (ix) => message.staticAccounts[ix.programAddressIndex] === MEMO_PROGRAM && !!ix.data && getUtf8Decoder().decode(ix.data) === memo,
    );
    return hasMemo && (await signedBy(payer, signature, new Uint8Array(tx.messageBytes)));
  } catch {
    return false;
  }
}
