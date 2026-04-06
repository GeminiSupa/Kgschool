import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Presentation, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Hilfe & Dokumentation | KG School',
  description: 'Benutzerhandbuch und Präsentationsfolien als Markdown zum Download und PDF-Export.',
}

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">
      <div className="max-w-2xl mx-auto px-6 py-12 md:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 mb-10"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Zur Startseite
        </Link>

        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500 mb-2">KG School</p>
        <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-plus-jakarta)] tracking-tight mb-3">
          Hilfe & Dokumentation
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-10">
          Laden Sie die Markdown-Dateien herunter und öffnen Sie sie im Editor, in Marp/Slidev oder drucken Sie sie im Browser als PDF
          („Drucken → Als PDF speichern“).
        </p>

        <div className="space-y-4">
          <a
            href="/api/docs/manual"
            download
            className="flex items-start gap-4 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-300" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-lg">Benutzerhandbuch</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Rollen, Module und Abläufe — für Leitung und Team (PDF-tauglich).
              </p>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-3">kg-school-manual.md →</p>
            </div>
          </a>

          <a
            href="/api/docs/presentation"
            download
            className="flex items-start gap-4 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm hover:border-fuchsia-300 dark:hover:border-fuchsia-500/50 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-950/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Presentation className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-300" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-lg">Präsentation</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Folienstruktur für Pitches und Einrichtungsvorstellungen (Marp, Druck, PDF).
              </p>
              <p className="text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400 mt-3">kg-school-presentation.md →</p>
            </div>
          </a>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-10 leading-relaxed">
          Quelldateien im Repository: <code className="text-slate-600 dark:text-slate-300">docs/MANUAL.md</code> und{' '}
          <code className="text-slate-600 dark:text-slate-300">docs/PRESENTATION.md</code>.
        </p>
      </div>
    </main>
  )
}
