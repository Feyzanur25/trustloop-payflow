"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { clearWalletConnection, connectWallet, getStoredWalletConnection } from "@/lib/wallet"

export default function Navbar() {
  const [walletAddress, setWalletAddress] = useState("")
  const [status, setStatus] = useState("Connect wallet")
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    const stored = getStoredWalletConnection()

    if (stored?.address) {
      setWalletAddress(stored.address)
      setStatus("Wallet connected")
    }
  }, [])

  async function handleConnect() {
    setIsConnecting(true)
    setStatus("Connecting...")

    try {
      const connection = await connectWallet()
      setWalletAddress(connection.address)
      setStatus("Wallet connected")
    } catch (error) {
      setWalletAddress("")
      setStatus(
        error instanceof Error ? error.message : "Failed to connect wallet"
      )
    } finally {
      setIsConnecting(false)
    }
  }

  function handleDisconnect() {
    clearWalletConnection()
    setWalletAddress("")
    setStatus("Connect wallet")
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold gradient-text">TrustLoop</h1>
        <p className="text-sm text-zinc-400">
          {walletAddress
            ? `Connected: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`
            : status}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={walletAddress ? handleDisconnect : handleConnect} disabled={isConnecting}>
          {isConnecting ? "Connecting..." : walletAddress ? "Disconnect Wallet" : "Connect Wallet"}
        </Button>
      </div>
    </div>
  )
}