import Link from 'next/link'

export const metadata = {
  title: 'AVV / DPA | Kid Cloud',
}

export default function DpaPage() {
  return (
    <main className="min-h-screen bg-background text-slate-900 dark:text-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/" className="text-sm text-aura-primary hover:brightness-110">
          ← Zurueck zur Startseite
        </Link>
        <h1 className="mt-4 text-3xl font-bold">AVV / Data Processing Agreement</h1>
        <p className="mt-3 text-sm text-ui-muted">
          Vorlage fuer den Abschluss eines Auftragsverarbeitungsvertrags (Art. 28 DSGVO).
        </p>

        <section className="mt-8 space-y-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Leistungsrahmen</h2>
          <p>
            Kid Cloud verarbeitet personenbezogene Daten ausschliesslich im Auftrag und auf dokumentierte Weisung der
            verantwortlichen Stelle.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Mindestinhalte des AVV</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Gegenstand, Dauer, Art und Zweck der Verarbeitung</li>
            <li>Kategorien betroffener Personen und Daten</li>
            <li>Rechte und Pflichten der verantwortlichen Stelle</li>
            <li>Technisch-organisatorische Massnahmen (TOMs)</li>
            <li>Regelungen zu Unterauftragsverarbeitern</li>
            <li>Unterstuetzung bei Betroffenenanfragen und Vorfallmanagement</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Anfrageprozess</h2>
          <p>
            Senden Sie Ihre AVV-Anfrage an <strong>dpa@kidcloud.app</strong>. Sie erhalten eine Vertragsvorlage,
            TOM-Anlage und die aktuelle Subunternehmerliste.
          </p>
        </section>
      </div>
    </main>
  )
}

