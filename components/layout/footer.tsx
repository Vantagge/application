export function Footer() {
  return (
    <footer className="sticky bottom-0 z-40 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 text-muted-foreground">
      <div className="mx-auto max-w-screen-2xl px-4 py-4 md:py-3 text-center text-sm">
        © {new Date().getFullYear()} Vantagge • Plataforma de Fidelização
      </div>
    </footer>
  )
}
