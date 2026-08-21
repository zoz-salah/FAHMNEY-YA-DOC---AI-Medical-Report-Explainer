import { Link } from "wouter";
import { Activity, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary selection:text-white">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto max-w-5xl flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center gap-2 text-primary font-medium text-lg tracking-tight hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Activity className="w-4 h-4" />
            </div>
            Fahmney Ya Doctor
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/history">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                <Clock className="w-4 h-4 mr-2" />
                Past Reports
              </Button>
            </Link>
            <Link href="/">
              <Button className="rounded-full shadow-sm">
                <FileText className="w-4 h-4 mr-2" />
                New Analysis
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="border-t border-border/40 bg-muted/30 py-8 mt-auto">
        <div className="container mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
          <p>Fahmney Ya Doctor &mdash; Your medical companion.</p>
          <p className="mt-1 opacity-70">Always consult your primary care physician for medical advice.</p>
        </div>
      </footer>
    </div>
  );
}
