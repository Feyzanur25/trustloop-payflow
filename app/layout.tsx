import Navbar from "@/components/navbar"

import "./globals.css"

export const metadata = {
  title: "TrustLoop PayFlow",
  description: "Stellar-powered SME payment platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-4 sm:px-6">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  )
}