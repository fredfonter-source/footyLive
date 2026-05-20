import './globals.css';

export const metadata = {
  title: 'Footylive — Live Football',
  description: 'Watch live football matches free on Footylive. Real-time scores and streams.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased">
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <a href="/" className="flex items-center gap-2.5 group mx-auto sm:mx-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400" />
                  <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="currentColor" strokeWidth="1.2" className="text-zinc-400" transform="rotate(0 12 12)" />
                  <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="currentColor" strokeWidth="1.2" className="text-zinc-400" transform="rotate(60 12 12)" />
                  <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="currentColor" strokeWidth="1.2" className="text-zinc-400" transform="rotate(120 12 12)" />
                  <circle cx="12" cy="12" r="2.5" fill="currentColor" className="text-zinc-400" />
                </svg>
              </div>
              <span className="text-[15px] font-semibold text-zinc-100">Footylive</span>
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
