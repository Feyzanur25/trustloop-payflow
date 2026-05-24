export default function AnimatedBg() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      
      {/* Cyan Glow */}
      <div
        className="
          absolute -top-40 -left-40
          w-125 h-125
          md:w-150 md:h-150
          bg-cyan-500/20
          blur-3xl
          rounded-full
        "
      />

      {/* Purple Glow */}
      <div
        className="
          absolute -bottom-40 -right-40
          w-125 h-125
          md:w-150 md:h-150
          bg-purple-500/20
          blur-3xl
          rounded-full
        "
      />

      {/* Center Glow */}
      <div
        className="
          absolute top-1/2 left-1/2
          w-100 h-100
          -translate-x-1/2 -translate-y-1/2
          bg-blue-500/10
          blur-3xl
          rounded-full
        "
      />

    </div>
  )
}