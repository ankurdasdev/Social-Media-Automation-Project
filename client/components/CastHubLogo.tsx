/**
 * CastHubLogo — reusable logo component using the official brand mark.
 *
 * Usage:
 *   <CastHubLogo size={40} />          — just the icon
 *   <CastHubLogo size={40} withText />  — icon + "CASTHUB" wordmark
 *   <CastHubLogo size={40} withText withTagline /> — icon + wordmark + tagline
 */

interface CastHubLogoProps {
  /** Size of the logo icon in px. Default: 40 */
  size?: number;
  /** If true, renders the "CASTHUB" wordmark next to the icon */
  withText?: boolean;
  /** If true (requires withText), renders the tagline below the wordmark */
  withTagline?: boolean;
  /** Extra class names for the wrapping element */
  className?: string;
  /** href to navigate to when the logo is clicked. Default: "/dashboard" */
  href?: string;
}

export default function CastHubLogo({
  size = 40,
  withText = false,
  withTagline = false,
  className = "",
  href = "/dashboard",
}: CastHubLogoProps) {
  const img = (
    <img
      src="/casthub-logo.png"
      alt="CastHub"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="object-contain shrink-0 drop-shadow-[0_0_8px_rgba(245,168,0,0.35)]"
      draggable={false}
    />
  );

  const content = withText ? (
    <div className={`flex items-center gap-3 ${className}`}>
      {img}
      <div className="flex flex-col leading-tight">
        <span className="font-black tracking-tight text-foreground" style={{ fontSize: size * 0.45 }}>
          CAST<span className="text-primary">HUB</span>
        </span>
        {withTagline && (
          <span className="text-muted-foreground/50 font-semibold tracking-wide" style={{ fontSize: size * 0.18 }}>
            Automate Your Outreach. Grow Your Opportunities.
          </span>
        )}
      </div>
    </div>
  ) : (
    <div className={className}>{img}</div>
  );

  return (
    <a href={href} className="inline-flex items-center">
      {content}
    </a>
  );
}
