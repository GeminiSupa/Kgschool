import Link from 'next/link'

export const metadata = {
  title: 'AVV / DPA | KG School',
}

export default function DpaPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/" className="text-sm text-indigo-700 hover:text-indigo-900">
          ← Zurueck zur Startseite
        </Link>
        <h1 className="mt-4 text-3xl font-bold">AVV / Data Processing Agreement</h1>
        <p className="mt-3 text-sm text-gray-600">
          Vorlage fuer den Abschluss eines Auftragsverarbeitungsvertrags (Art. 28 DSGVO).
        </p>

        <section className="mt-8 space-y-4 text-sm leading-6 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">Leistungsrahmen</h2>
          <p>
            KG School verarbeitet personenbezogene Daten ausschliesslich im Auftrag und auf dokumentierte Weisung der
            verantwortlichen Stelle.
          </p>

          <h2 className="text-xl font-semibold text-gray-900">Mindestinhalte des AVV</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Gegenstand, Dauer, Art und Zweck der Verarbeitung</li>
            <li>Kategorien betroffener Personen und Daten</li>
            <li>Rechte und Pflichten der verantwortlichen Stelle</li>
            <li>Technisch-organisatorische Massnahmen (TOMs)</li>
            <li>Regelungen zu Unterauftragsverarbeitern</li>
            <li>Unterstuetzung bei Betroffenenanfragen und Vorfallmanagement</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900">Anfrageprozess</h2>
          <p>
            Senden Sie Ihre AVV-Anfrage an <strong>dpa@kgschool.de</strong>. Sie erhalten eine Vertragsvorlage,
            TOM-Anlage und die aktuelle Subunternehmerliste.
          </p>
        </section>
      </div>
    </main>
  )
}

