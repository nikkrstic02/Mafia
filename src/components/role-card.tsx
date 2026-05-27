import type { CSSProperties } from "react";
import type { Role } from "@/lib/roles";

const ROLE_THEME: Record<Role, { label: string; accent: string; glow: string }> = {
  Mafia: { label: "Mafia", accent: "#ff363d", glow: "rgba(255,54,61,0.34)" },
  Lady: { label: "Lady", accent: "#a855f7", glow: "rgba(168,85,247,0.34)" },
  Police: { label: "Police", accent: "#2f8cff", glow: "rgba(47,140,255,0.34)" },
  Doctor: { label: "Doctor", accent: "#4fca4f", glow: "rgba(79,202,79,0.34)" },
  Citizen: { label: "Citizen", accent: "#b9b9b9", glow: "rgba(185,185,185,0.28)" },
  Narrator: { label: "Narrator", accent: "#f5b82e", glow: "rgba(245,184,46,0.34)" },
};

const ROLE_ICONS: Record<Role, string> = {
  Mafia: "/role-icons/mafia.svg",
  Lady: "/role-icons/lady.svg",
  Police: "/role-icons/police.svg",
  Doctor: "/role-icons/doctor.svg",
  Citizen: "/role-icons/citizen.svg",
  Narrator: "/role-icons/narrator.svg",
};

function Spark({ color, className }: { color: string; className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 1.5 15.4 8.6 22.5 12 15.4 15.4 12 22.5 8.6 15.4 1.5 12 8.6 8.6 12 1.5Z"
        fill={color}
      />
    </svg>
  );
}

function RoleIcon({ role, color }: { role: Role; color: string }) {
  const maskSize = role === "Mafia" || role === "Citizen" ? "116%" : "contain";
  const style = {
    "--icon-url": `url("${ROLE_ICONS[role]}")`,
    "--icon-start": shinyStart(role),
    "--icon-mid": color,
    "--icon-end": shinyEnd(role),
    "--icon-mask-size": maskSize,
    filter: `drop-shadow(0 16px 18px ${ROLE_THEME[role].glow})`,
  } as CSSProperties;

  return (
    <div
      className="h-[134px] w-[184px] bg-[linear-gradient(135deg,var(--icon-start),var(--icon-mid)_48%,var(--icon-end))] [mask-image:var(--icon-url)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:var(--icon-mask-size)] [-webkit-mask-image:var(--icon-url)] [-webkit-mask-position:center] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:var(--icon-mask-size)]"
      style={style}
      aria-hidden="true"
    />
  );
}

function shinyStart(role: Role) {
  switch (role) {
    case "Mafia":
      return "#ff6f74";
    case "Lady":
      return "#d9a7ff";
    case "Police":
      return "#69bdff";
    case "Doctor":
      return "#72df6f";
    case "Narrator":
      return "#ffd96a";
    case "Citizen":
      return "#f0f0f0";
  }
}

function shinyEnd(role: Role) {
  switch (role) {
    case "Mafia":
      return "#b80f19";
    case "Lady":
      return "#6f25c9";
    case "Police":
      return "#1261d8";
    case "Doctor":
      return "#249326";
    case "Narrator":
      return "#c9820b";
    case "Citizen":
      return "#878787";
  }
}

export function RoleCard({
  role,
  subtitle,
}: {
  role?: Role;
  subtitle?: string;
}) {
  if (!role) {
    return (
      <div className="flex aspect-[325/436] w-full max-w-[325px] items-center justify-center rounded-[24px] border border-white/15 bg-[#05090f] px-8 text-center shadow-[0_20px_70px_rgba(0,0,0,0.45)]">
        <p className="text-sm font-medium text-white/55">{subtitle ?? "Waiting for your role..."}</p>
      </div>
    );
  }

  const theme = ROLE_THEME[role];

  return (
    <div
      className="relative flex aspect-[325/436] w-full max-w-[325px] flex-col items-center justify-between overflow-hidden rounded-[24px] border-2 bg-[#05090f] px-8 py-9 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      style={{
        borderColor: theme.accent,
        boxShadow: `0 24px 80px rgba(0,0,0,0.55), inset 0 0 36px rgba(255,255,255,0.035), 0 0 34px ${theme.glow}`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.08),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.08),transparent_28%,rgba(255,255,255,0.04))]" />
      <Spark color={theme.accent} className="relative z-10 h-5 w-5" />
      <div className="relative z-10 flex min-h-0 flex-1 items-center">
        <RoleIcon role={role} color={theme.accent} />
      </div>
      <div className="relative z-10">
        <h2 className="text-[clamp(2rem,11vw,2.5rem)] font-bold leading-none tracking-normal text-white drop-shadow-[0_5px_12px_rgba(0,0,0,0.65)]">
          {theme.label}
        </h2>
        <Spark color={theme.accent} className="mx-auto mt-10 h-5 w-5" />
        {subtitle ? (
          <p className="mt-4 text-xs font-medium text-white/50">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
