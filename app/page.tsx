import Link from "next/link"

import AnimatedBg from "@/components/animated-bg"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const highlights = [
  {
    title: "OFW remittance flow",
    description: "A faster way to send money home with a premium, wallet-first workflow built for trust.",
  },
  {
    title: "SME payout operations",
    description: "Track invoices, approvals, and confirmations from a single dashboard that teams can adopt quickly.",
  },
  {
    title: "Stellar-native visibility",
    description: "Every payment is surfaced with status, hash, and operational context for easier review.",
  },
]

const steps = [
  {
    title: "1. Connect wallet",
    description: "Open Freighter and connect your Stellar wallet in seconds.",
  },
  {
    title: "2. Create payout",
    description: "Enter recipient, amount, and memo for a clear, auditable payment request.",
  },
  {
    title: "3. Track confirmation",
    description: "Review the ledger result, transaction hash, and payment status instantly.",
  },
]

const impact = [
  "Reduce manual coordination in payout operations",
  "Make remittance flows easier to explain and trust",
  "Bring payment visibility to teams without adding backend complexity",
]

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden px-6 pb-12 pt-6">
      <AnimatedBg />

      <div className="z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">TrustLoop PayFlow</p>
          <h1 className="mt-4 text-5xl font-bold gradient-text sm:text-6xl md:text-7xl">
            Faster, clearer Stellar payouts for real-world finance teams
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-zinc-300 md:text-xl">
            TrustLoop PayFlow helps teams move money with a premium dashboard, wallet-first
            signing, and clear transaction visibility designed for OFW remittances, SME
            payouts, and modern finance operations.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 md:flex-row">
            <Button asChild className="rounded-2xl px-8 py-6 text-lg glow">
              <Link href="/dashboard">Launch control center</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="rounded-2xl border-white/10 px-8 py-6 text-lg hover:bg-white/5"
            >
              <a href="https://github.com" target="_blank" rel="noreferrer">
                Explore code
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <Card key={item.title} className="glass rounded-3xl">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}