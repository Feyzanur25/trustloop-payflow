import { Card } from "@/components/ui/card"

export default function StatsCard({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <Card className="glass p-6 rounded-3xl">
      <p className="text-zinc-400">{title}</p>
      <h2 className="text-4xl font-bold mt-2">{value}</h2>
    </Card>
  )
}