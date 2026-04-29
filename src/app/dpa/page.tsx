import Link from 'next/link'

export const metadata = {
  title: 'AVV / DPA | Kid Cloud',
}

export default function DpaPage() {
  return (
    <main className="min-h-screen bg-background text-slate-900 dark:text-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/" className="text-sm text-aura-primary hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--aura-primary)/25 rounded-md px-1">
          ← Zurueck zur Startseite
        </Link>
        <h1 className="mt-4 text-3xl font-bold">AVV / Data Processing Agreement</h1>
        <p className="mt-3 text-sm text-ui-muted">
          Informationen zum Auftragsverarbeitungsvertrag fuer Kunden und Partner von Kid Cloud, bereitgestellt durch
          die ZAHA GLOBAL GmbH.
        </p>

        <section className="mt-8 space-y-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Leistungsrahmen</h2>
          <p>
            Sofern ZAHA GLOBAL GmbH personenbezogene Daten im Rahmen von Kid Cloud fuer Kitas, Traeger oder andere
            Organisationen verarbeitet, geschieht dies ausschliesslich im Auftrag und auf dokumentierte Weisung der
            jeweils verantwortlichen Stelle.
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

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Vertragspartner</h2>
          <p>
            Auftragsverarbeiter:
            <br />
            ZAHA GLOBAL GmbH
            <br />
            ZAHA GLOBAL UG
            <br />
            Adolfstr. 32, D-52134 Herzogenrath
            <br />
            Deutschland
            <br />
            Register: Amtsgericht Aachen, HRB 27903
            <br />
            EUID: DER3101.HRB27903
          </p>
          <p>
            Verantwortliche Stelle:
            <br />
            Die jeweils vertragsschliessende Kita, der Traeger oder die nutzende Organisation.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Anfrageprozess</h2>
          <p>
            Senden Sie Ihre AVV- oder DPA-Anfrage an <strong>info@zahaglobal.co</strong> oder nutzen Sie die auf der
            Unternehmenswebseite veroeffentlichte Rufnummer <strong>+49 170 9057 359</strong> fuer die Erstaufnahme.
            Auf Anfrage koennen AVV/DPA-Vorlage, TOM-Anlage und Informationen zu eingesetzten
            Unterauftragsverarbeitern bereitgestellt werden.
          </p>
        </section>
      </div>
    </main>
  )
}

