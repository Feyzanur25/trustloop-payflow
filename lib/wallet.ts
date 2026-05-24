import {
  isConnected,
  requestAccess,
  getAddress,
  getNetwork,
} from "@stellar/freighter-api"

const walletStorageKey = "trustloop-wallet-connection"

export type WalletConnection = {
  address: string
  network: string
  networkPassphrase: string
}

function saveWalletConnection(connection: WalletConnection) {
  window.localStorage.setItem(walletStorageKey, JSON.stringify(connection))
}

export function getStoredWalletConnection(): WalletConnection | null {
  if (typeof window === "undefined") {
    return null
  }

  const saved = window.localStorage.getItem(walletStorageKey)

  if (!saved) {
    return null
  }

  try {
    return JSON.parse(saved) as WalletConnection
  } catch {
    window.localStorage.removeItem(walletStorageKey)
    return null
  }
}

export function clearWalletConnection() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(walletStorageKey)
}

export async function connectWallet(): Promise<WalletConnection> {
  const connected = await isConnected()

  if (!connected) {
    throw new Error("Freighter wallet not detected. Please install and open it.")
  }

  await requestAccess()

  const address = await getAddress()

  if (!address?.address) {
    throw new Error("Unable to read wallet address.")
  }

  const network = await getNetwork()
  const connection = {
    address: address.address,
    network: network.network || "Testnet",
    networkPassphrase: network.networkPassphrase || "Test SDF Network ; September 2015",
  }

  saveWalletConnection(connection)

  return connection
}

export async function getWalletNetwork() {
  const network = await getNetwork()

  return {
    network: network.network || "Testnet",
    networkPassphrase: network.networkPassphrase || "Test SDF Network ; September 2015",
  }
}