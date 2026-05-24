import * as StellarSdk from "@stellar/stellar-sdk"

export const server = new StellarSdk.Horizon.Server(
  "https://horizon-testnet.stellar.org"
)

export const networkPassphrase =
  StellarSdk.Networks.TESTNET