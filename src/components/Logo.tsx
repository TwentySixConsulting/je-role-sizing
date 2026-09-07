import logo from '../assets/twentysix-logo.png'

/**
 * The current TwentySix mark. The source artwork is blue on white; the copy in
 * `public/` has the white recovered as transparency so it sits on the cream
 * background without a box around it.
 */
export function Logo({ className = '', height = 26 }: { className?: string; height?: number }) {
  return (
    <img
      src={logo}
      alt="TwentySix Consulting"
      height={height}
      style={{ height }}
      className={`w-auto ${className}`}
    />
  )
}
