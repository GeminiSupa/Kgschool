import Link from 'next/link'

export const metadata = {
  title: 'Datenschutz | Kid Cloud',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-slate-900 dark:text-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/" className="text-sm text-aura-primary hover:brightness-110">
          ← Zurueck zur Startseite
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Datenschutzerklaerung</h1>
        <p className="mt-3 text-sm text-ui-muted">Stand: 2026-03-27</p>

        <section className="mt-8 space-y-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
          <p>
            Diese Seite beschreibt, wie personenbezogene Daten in Kid Cloud verarbeitet werden. Der Text ist als
            Vorlage gedacht und muss vor Live-Betrieb durch Rechtsberatung geprueft werden.
          </p>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">1. Verarbeitungszwecke</h2>
          <p>
            Betreuung, Kommunikation, Vertragsverwaltung, Abrechnung, Personaleinsatzplanung, Dokumentation und
            gesetzliche Nachweis-/Meldepflichten.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">2. Kategorien von Daten</h2>
          <p>
            Stammdaten von Kindern, Sorgeberechtigten und Mitarbeitenden, Betreuungs-/Vertragsdaten, Anwesenheit,
            Kommunikationsinhalte, Abrechnungsdaten sowie technische Protokolle.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">3. Rechtsgrundlagen</h2>
          <p>
            Art. 6 Abs. 1 lit. b, c, e DSGVO; Art. 9 Abs. 2 DSGVO soweit erforderlich; einschlaegige Fachgesetze
            (u. a. SGB VIII, KiBiz NRW) sowie Einwilligungen gemaess Art. 6 Abs. 1 lit. a DSGVO.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">4. Speicherung und Loeschung</h2>
          <p>
            Daten werden nur so lange gespeichert, wie dies fuer den Zweck oder gesetzliche Aufbewahrungsfristen
            erforderlich ist. Danach erfolgt Loeschung oder Anonymisierung.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">5. Betroffenenrechte</h2>
          <p>
            Auskunft, Berichtigung, Loeschung, Einschraenkung, Datenuebertragbarkeit und Widerspruch nach Art. 15-21
            DSGVO. Anfragen koennen ueber die verantwortliche Stelle oder Datenschutzbeauftragte eingereicht werden.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">6. Sicherheit</h2>
          <p>
            Transportverschluesselung (TLS), rollenbasierte Zugriffe, Protokollierung sicherheitsrelevanter Aktionen,
            Backups und Incident-Management gemaess TOMs.
          </p>
        </section>
      </div>
    </main>
  )
}

