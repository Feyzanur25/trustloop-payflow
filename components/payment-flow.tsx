"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react"
import { StrKey } from "@stellar/stellar-sdk"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { connectWallet, getStoredWalletConnection } from "@/lib/wallet"
import { submitPayment, type PaymentPayload, type PaymentResult } from "@/lib/stellar-actions"

export type PaymentRecord = {
  id: string
  recipient: string
  amount: string
  memo: string
  status: "confirmed" | "pending" | "failed"
  createdAt: string
  hash: string
}

const starterPayments: PaymentRecord[] = [
  {
    id: "1",
    recipient: "GDXS...7K2N",
    amount: "120.00",
    memo: "Invoice #2048",
    status: "confirmed",
    createdAt: "2026-05-24T10:05:00.000Z",
    hash: "7e1a8d08c1b8f0f0",
  },
  {
    id: "2",
    recipient: "GBCX...P01Q",
    amount: "84.50",
    memo: "Client retainer",
    status: "pending",
    createdAt: "2026-05-24T09:15:00.000Z",
    hash: "f5b1c22f4a0d1d9f",
  },
  {
    id: "3",
    recipient: "GJWS...9H7T",
    amount: "320.75",
    memo: "Marketplace payout",
    status: "confirmed",
    createdAt: "2026-05-23T16:55:00.000Z",
    hash: "96bcb245fd796f0a",
  },
]

const storageKey = "trustloop-payflow-payments"

export default function PaymentFlow() {
  const [walletAddress, setWalletAddress] = useState("")
  const [walletNetwork, setWalletNetwork] = useState("Testnet")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState("")
  const [paymentError, setPaymentError] = useState("")
  const [payments, setPayments] = useState<PaymentRecord[]>(starterPayments)
  const [draft, setDraft] = useState<PaymentPayload>({
    recipient: "",
    amount: "",
    memo: "TrustLoop invoice",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<PaymentRecord["status"] | "all">("all")
  const [sortMode, setSortMode] = useState<"newest" | "highest" | "lowest">("newest")

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)

    if (saved) {
      try {
        setPayments(JSON.parse(saved) as PaymentRecord[])
      } catch {
        window.localStorage.removeItem(storageKey)
      }
    }

    const storedWallet = getStoredWalletConnection()

    if (storedWallet) {
      setWalletAddress(storedWallet.address)
      setWalletNetwork(storedWallet.network)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(payments))
  }, [payments])

  const summary = useMemo(() => {
    const total = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const confirmed = payments.filter((item) => item.status === "confirmed").length

    return {
      total,
      confirmed,
      pending: payments.filter((item) => item.status === "pending").length,
      failed: payments.filter((item) => item.status === "failed").length,
      successRate: payments.length ? Math.round((confirmed / payments.length) * 100) : 0,
    }
  }, [payments])

  const filteredPayments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    let nextPayments = [...payments]

    if (statusFilter !== "all") {
      nextPayments = nextPayments.filter((item) => item.status === statusFilter)
    }

    if (normalizedSearch) {
      nextPayments = nextPayments.filter((item) => {
        const haystack = `${item.recipient} ${item.memo} ${item.hash}`.toLowerCase()
        return haystack.includes(normalizedSearch)
      })
    }

    nextPayments.sort((left, right) => {
      if (sortMode === "newest") {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      }

      if (sortMode === "highest") {
        return Number(right.amount) - Number(left.amount)
      }

      return Number(left.amount) - Number(right.amount)
    })

    return nextPayments
  }, [payments, searchTerm, sortMode, statusFilter])

  const activityTrend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (6 - index))
      const key = date.toISOString().slice(0, 10)
      const entries = payments.filter((item) => item.createdAt.slice(0, 10) === key)

      return {
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        total: entries.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        count: entries.length,
      }
    })

    const maxTotal = Math.max(...days.map((item) => item.total), 1)

    return days.map((item) => ({
      ...item,
      height: Math.max(18, (item.total / maxTotal) * 100),
    }))
  }, [payments])

  const topRecipients = useMemo(() => {
    const aggregated = payments.reduce<Record<string, number>>((accumulator, payment) => {
      accumulator[payment.recipient] = (accumulator[payment.recipient] || 0) + Number(payment.amount || 0)
      return accumulator
    }, {})

    return Object.entries(aggregated)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
  }, [payments])

  const lastPayment = payments[0]
  const currentViewTotal = filteredPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  )

  const formValidation = useMemo(() => {
    const recipient = draft.recipient.trim()
    const amount = draft.amount.trim()

    if (!recipient) {
      return "Recipient is required."
    }

    if (!StrKey.isValidEd25519PublicKey(recipient)) {
      return "Recipient must be a valid Stellar public key."
    }

    if (!amount) {
      return "Amount is required."
    }

    if (!/^\d+(?:\.\d{1,7})?$/.test(amount)) {
      return "Amount must be a positive decimal with up to 7 decimals."
    }

    const numericAmount = Number(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return "Amount must be greater than zero."
    }

    return ""
  }, [draft])

  const handleConnect = async () => {
    setIsConnecting(true)
    setPaymentError("")

    try {
      const connection = await connectWallet()
      setWalletAddress(connection.address)
      setWalletNetwork(connection.network)
      setPaymentMessage("Wallet connected successfully.")
    } catch (error) {
      setWalletAddress("")
      setPaymentError(error instanceof Error ? error.message : "Unable to connect wallet.")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setPaymentError("")
    setPaymentMessage("")

    try {
      if (!draft.recipient || !draft.amount) {
        throw new Error("Recipient and amount are required.")
      }

      if (!walletAddress) {
        const connection = await connectWallet()
        setWalletAddress(connection.address)
        setWalletNetwork(connection.network)
      }

      const result: PaymentResult = await submitPayment(draft)

      const record: PaymentRecord = {
        id: `${Date.now()}`,
        recipient: draft.recipient,
        amount: draft.amount,
        memo: draft.memo,
        status: result.status === "submitted" ? "confirmed" : result.status,
        createdAt: new Date().toISOString(),
        hash: result.hash,
      }

      setPayments((current) => [record, ...current])
      setDraft({ recipient: "", amount: "", memo: "TrustLoop invoice" })
      setPaymentMessage(
        `${result.message} Recipient: ${draft.recipient.trim()}. Amount: ${draft.amount.trim()}. Hash: ${result.hash}`
      )
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Unable to submit payment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge variant="outline" className="border-cyan-400/50 text-cyan-200">
            <Sparkles className="size-3" />
            Intelligent payment operations
          </Badge>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Control center</p>
            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">TrustLoop payment cockpit</h1>
            <p className="mt-3 max-w-2xl text-zinc-300">
              Connect your wallet, launch Stellar transfers, and track every payment in one
              premium workspace.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleConnect} disabled={isConnecting} className="rounded-2xl px-5 py-5">
            <Wallet className="mr-2 size-4" />
            {isConnecting ? "Connecting..." : walletAddress ? "Reconnect wallet" : "Connect wallet"}
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl border-white/10 px-5 py-5 hover:bg-white/5"
            onClick={() => setDraft({ recipient: "", amount: "", memo: "TrustLoop invoice" })}
          >
            Clear form
          </Button>
        </div>
      </div>

      {(paymentMessage || paymentError) && (
        <Card className={paymentError ? "border-red-500/50 bg-red-500/10" : "border-cyan-400/50 bg-cyan-500/10"}>
          <CardContent className="py-4 text-sm">
            {paymentError || paymentMessage}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="glass rounded-3xl">
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-400">Tracked volume</p>
            <h2 className="mt-3 text-3xl font-bold">${summary.total.toFixed(2)}</h2>
            <p className="mt-2 text-sm text-emerald-300">+12% vs last week</p>
          </CardContent>
        </Card>

        <Card className="glass rounded-3xl">
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-400">Confirmed payouts</p>
            <h2 className="mt-3 text-3xl font-bold">{summary.confirmed}</h2>
            <p className="mt-2 text-sm text-cyan-200">Current success pipeline</p>
          </CardContent>
        </Card>

        <Card className="glass rounded-3xl">
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-400">Pending payments</p>
            <h2 className="mt-3 text-3xl font-bold">{summary.pending}</h2>
            <p className="mt-2 text-sm text-amber-200">Awaiting ledger confirmation</p>
          </CardContent>
        </Card>

        <Card className="glass rounded-3xl">
          <CardContent className="pt-6">
            <p className="text-sm text-zinc-400">Success rate</p>
            <h2 className="mt-3 text-3xl font-bold">{summary.successRate}%</h2>
            <p className="mt-2 text-sm text-violet-200">Smart routing enabled</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_1fr]">
        <Card className="glass rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-cyan-200" />
              Operations pulse
            </CardTitle>
            <CardDescription>Live health of your current payment workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-zinc-300">Wallet</p>
              <p className="mt-2 font-mono text-sm text-cyan-200">
                {walletAddress || "Freighter not connected"}
              </p>
              <p className="mt-2 text-sm text-zinc-400">Network: {walletNetwork}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-zinc-300">Current view</p>
                <p className="mt-2 text-2xl font-bold">${currentViewTotal.toFixed(2)}</p>
                <p className="mt-2 text-sm text-zinc-400">Filtered activity total</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-zinc-300">Latest event</p>
                <p className="mt-2 text-sm font-medium">{lastPayment?.memo || "No payments yet"}</p>
                <p className="mt-2 text-sm text-zinc-400">
                  {lastPayment?.status || "Awaiting activity"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4 text-violet-200" />
              Velocity trend
            </CardTitle>
            <CardDescription>Weekly volume pattern across your latest activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-3">
              {activityTrend.map((item) => (
                <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-full w-full items-end justify-center rounded-2xl bg-white/5 px-2 py-1">
                    <div
                      className="w-full rounded-xl bg-linear-to-t from-cyan-400 to-violet-500"
                      style={{ height: `${item.height}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-300">{item.label}</p>
                    <p className="text-[11px] text-zinc-400">${item.total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4 text-emerald-200" />
              Top recipients
            </CardTitle>
            <CardDescription>Largest payout concentration in your current history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topRecipients.map(([recipient, total], index) => (
              <div key={recipient} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">#{index + 1} {recipient}</p>
                    <p className="text-xs text-zinc-400">{payments.filter((item) => item.recipient === recipient).length} payouts</p>
                  </div>
                  <p className="text-sm font-semibold">${total.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="bg-white/5">
          <TabsTrigger value="payments">Create payment</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="glass rounded-3xl">
              <CardHeader>
                <CardTitle>Send a new payment</CardTitle>
                <CardDescription>
                  Build a Stellar payment in seconds and sign it with Freighter.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-300">Recipient</p>
                    <Input
                      placeholder="GABC..."
                      value={draft.recipient}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, recipient: event.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-zinc-300">Amount</p>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="125.00"
                      value={draft.amount}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, amount: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-zinc-300">Memo</p>
                  <Input
                    placeholder="Invoice / note"
                    value={draft.memo}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, memo: event.target.value }))
                    }
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">Wallet state</span>
                    <Badge variant={walletAddress ? "default" : "secondary"}>
                      {walletAddress ? "Connected" : "Not connected"}
                    </Badge>
                  </div>
                  <p className="mt-3 font-mono text-sm text-cyan-200">
                    {walletAddress || "Connect Freighter to enable signing."}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">Network: {walletNetwork}</p>
                </div>

                {formValidation ? (
                  <p className="text-sm text-amber-200">{formValidation}</p>
                ) : (
                  <p className="text-sm text-zinc-400">
                    Review the recipient, amount, and memo before signing the transaction.
                  </p>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || Boolean(formValidation)}
                  className="w-full rounded-2xl py-6 text-base"
                >
                  <ArrowRightLeft className="mr-2 size-4" />
                  {isSubmitting ? "Sending..." : "Send payment"}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="glass rounded-3xl">
                <CardHeader>
                  <CardTitle>Why teams upgrade</CardTitle>
                  <CardDescription>
                    Every action is optimized for speed, visibility, and risk control.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: ShieldCheck, title: "End-to-end protection", text: "Signature flows and validation are surfaced clearly in the UI." },
                    { icon: Zap, title: "Instant settlement insight", text: "Track pending and confirmed transactions without leaving the dashboard." },
                    { icon: Clock3, title: "Audit-ready activity", text: "Every payment is stored locally for quick review and follow-up." },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-3 rounded-2xl bg-white/5 p-3">
                      <item.icon className="mt-1 size-4 text-cyan-200" />
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-zinc-400">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass rounded-3xl">
                <CardHeader>
                  <CardTitle>Automation snapshot</CardTitle>
                  <CardDescription>
                    Premium features are ready to expand into multi-user workflows.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-2xl bg-linear-to-br from-cyan-500/20 to-violet-500/20 p-4">
                    <p className="text-sm text-zinc-200">Smart routing</p>
                    <p className="mt-2 text-2xl font-bold">98.4% operational confidence</p>
                    <p className="mt-3 text-sm text-zinc-300">
                      Built for growing finance teams that need a polished, dependable payment surface.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="glass rounded-3xl">
            <CardHeader>
              <CardTitle>Recent payment activity</CardTitle>
              <CardDescription>
                Search, filter, and sort your payment history in seconds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-2">
                  <p className="text-sm text-zinc-300">Search activity</p>
                  <Input
                    placeholder="Recipient, memo, or hash"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-zinc-300">Quick filters</p>
                  <div className="flex flex-wrap gap-2">
                    {(["all", "confirmed", "pending", "failed"] as const).map((option) => (
                      <Button
                        key={option}
                        type="button"
                        variant={statusFilter === option ? "default" : "outline"}
                        className="rounded-full"
                        onClick={() => setStatusFilter(option)}
                      >
                        {option === "all" ? "All" : option}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="text-sm text-zinc-300">Showing {filteredPayments.length} of {payments.length} payments</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Confirmed: {summary.confirmed} • Pending: {summary.pending} • Failed: {summary.failed}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "newest", label: "Newest first" },
                    { key: "highest", label: "Highest amount" },
                    { key: "lowest", label: "Lowest amount" },
                  ].map((option) => (
                    <Button
                      key={option.key}
                      type="button"
                      variant={sortMode === option.key ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => setSortMode(option.key as typeof sortMode)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-zinc-300">Current view total</p>
                    <p className="mt-2 text-2xl font-bold">
                      ${filteredPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                      setSortMode("newest")
                    }}
                  >
                    Reset filters
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Memo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-zinc-400">
                        No payments match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.recipient}</TableCell>
                        <TableCell>${payment.amount}</TableCell>
                        <TableCell>{payment.memo}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.status === "confirmed"
                                ? "default"
                                : payment.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {payment.status === "confirmed" ? (
                              <CheckCircle2 className="size-3" />
                            ) : payment.status === "pending" ? (
                              <Clock3 className="size-3" />
                            ) : (
                              <XCircle className="size-3" />
                            )}
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{payment.hash}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="glass rounded-3xl">
              <CardHeader>
                <CardTitle>Operational outlook</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-zinc-300">
                <p>• Volume visibility is now centralized inside the dashboard.</p>
                <p>• Payments can be signed directly with Freighter from the UI.</p>
                <p>• Local activity history enables fast reporting without a backend dependency.</p>
              </CardContent>
            </Card>

            <Card className="glass rounded-3xl">
              <CardHeader>
                <CardTitle>Roadmap-ready enhancements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-zinc-300">
                <p>• Supabase-backed multi-user workspaces</p>
                <p>• Real-time payout confirmations and webhook sync</p>
                <p>• Customer and invoice management tools</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
