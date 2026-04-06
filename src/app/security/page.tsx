import Link from 'next/link'

export const metadata = {
  title: 'Security & Compliance | KG School',
}

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 dark:text-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link href="/" className="text-sm text-indigo-700 hover:text-indigo-900">
          ← Zurueck zur Startseite
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Security, Ethik und Compliance</h1>
        <p className="mt-3 text-sm text-ui-muted">
          Orientierung fuer Traeger und Kommunen. Diese Seite kann als Grundlage fuer Vergabeunterlagen genutzt
          werden.
        </p>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold">Datenschutz (DSGVO)</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
              <li>Auftragsverarbeitung (AVV) nach Art. 28 DSGVO</li>
              <li>Rollenbasierte Zugriffskontrolle und Mandantentrennung</li>
              <li>Datenminimierung und Zweckbindung</li>
              <li>Loesch- und Aufbewahrungskonzepte</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold">Technische Sicherheit</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
              <li>TLS-Verschluesselung fuer Datenuebertragung</li>
              <li>Backup- und Wiederherstellungsprozesse</li>
              <li>Auditierbare Admin- und Sicherheitsereignisse</li>
              <li>Incident-Management und Eskalationspfade</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold">Ethische Datenverarbeitung</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
              <li>Keine versteckte Profilbildung mit Kinderdaten</li>
              <li>Transparente Einwilligungen und Widerrufsmoeglichkeiten</li>
              <li>Nachvollziehbarkeit automatisierter Regeln</li>
              <li>Human-in-the-loop fuer paedagogische Entscheidungen</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold">Betrieb fuer Kommunen</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
              <li>Mehrstandortfaehig fuer Traeger und Stadtverbuende</li>
              <li>Berichtswesen fuer Jugendamt und Tragerleitungen</li>
              <li>Export-/Importpfade fuer Altdatenmigration</li>
              <li>Schulungs- und Rolloutkonzept in Phasen</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  )
}

