import * as StellarSdk from "@stellar/stellar-sdk"
import { getAddress, getNetwork, signTransaction } from "@stellar/freighter-api"

import { server } from "@/lib/stellar"

export type PaymentPayload = {
  recipient: string
  amount: string
  memo: string
}

export type PaymentResult = {
  hash: string
  status: "submitted" | "pending" | "failed"
  message: string
}

function validatePaymentPayload(payload: PaymentPayload) {
  const recipient = payload.recipient.trim()
  const amount = payload.amount.trim()
  const memo = payload.memo.trim() || "TrustLoop PayFlow"

  if (!recipient) {
    throw new Error("Recipient is required.")
  }

  if (!StellarSdk.StrKey.isValidEd25519PublicKey(recipient)) {
    throw new Error("Recipient must be a valid Stellar public key.")
  }

  if (!amount) {
    throw new Error("Amount is required.")
  }

  if (!/^\d+(?:\.\d{1,7})?$/.test(amount)) {
    throw new Error("Amount must be a positive decimal with up to 7 decimals.")
  }

  const numericAmount = Number(amount)

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Amount must be greater than zero.")
  }

  if (memo.length > 28) {
    throw new Error("Memo must be 28 characters or fewer.")
  }

  return {
    recipient,
    amount,
    memo,
  }
}

export async function submitPayment(payload: PaymentPayload): Promise<PaymentResult> {
  const wallet = await getAddress()

  if (!wallet.address) {
    throw new Error("Freighter wallet is not connected.")
  }

  const network = await getNetwork()

  if (!network.networkPassphrase) {
    throw new Error("Unable to detect Stellar network.")
  }

  const sanitized = validatePaymentPayload(payload)
  const sourceAccount = await server.loadAccount(wallet.address)

  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: network.networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: sanitized.recipient,
        asset: StellarSdk.Asset.native(),
        amount: sanitized.amount,
      })
    )
    .addMemo(StellarSdk.Memo.text(sanitized.memo))
    .setTimeout(180)
    .build()

  const signed = await signTransaction(tx.toXDR(), {
    networkPassphrase: network.networkPassphrase,
  })

  if (!signed.signedTxXdr) {
    throw new Error("Freighter could not sign the transaction.")
  }

  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    network.networkPassphrase
  )

  const response = await server.submitTransaction(signedTx)

  return {
    hash: response.hash,
    status: response.successful ? "submitted" : "failed",
    message: response.successful
      ? "Payment confirmed on Stellar."
      : "Payment failed to submit to Stellar.",
  }
}
