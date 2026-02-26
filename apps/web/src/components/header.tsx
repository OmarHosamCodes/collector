import { Link } from "@tanstack/react-router";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/compliance", label: "Compliance" },
    { to: "/privacy-policy", label: "Privacy Policy" },
    { to: "/terms-of-service", label: "Terms" },
  ] as const;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <nav className="flex flex-wrap gap-4 text-sm sm:text-base">
          {links.map(({ to, label }) => {
            return (
              <Link
                key={to}
                to={to}
                className="text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground underline underline-offset-4" }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <hr />
    </div>
  );
}
