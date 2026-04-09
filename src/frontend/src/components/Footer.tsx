export default function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.hostname)
      : "";

  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-5 px-4 md:px-6">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2">
            <img
              src="/assets/uploads/grok_image_xcsys9y-1.jpg"
              alt="Chain File"
              className="h-5 w-5 rounded object-cover"
            />
            <span className="text-sm font-display font-semibold text-foreground">
              Chain File
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            © {year}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/70 hover:text-accent transition-colors font-medium underline underline-offset-2"
            >
              caffeine.ai
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by the Internet Computer
          </p>
        </div>
      </div>
    </footer>
  );
}
