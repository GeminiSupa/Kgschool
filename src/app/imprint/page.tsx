import Link from 'next/link'

export const metadata = {
  title: 'Impressum | KG School',
}

export default function ImprintPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 dark:text-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/" className="text-sm text-indigo-700 hover:text-indigo-900">
          ← Zurueck zur Startseite
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Impressum</h1>
        <p className="mt-3 text-sm text-ui-muted">
          Platzhalter-Vorlage. Bitte vor Veroeffentlichung mit Ihren echten Unternehmensdaten ersetzen.
        </p>

        <section className="mt-8 space-y-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
          <p>
            <strong>Anbieter:</strong>
            <br />
            KG School GmbH
            <br />
            Musterstrasse 1
            <br />
            52062 Aachen
            <br />
            Deutschland
          </p>
          <p>
            <strong>Kontakt:</strong>
            <br />
            E-Mail: kontakt@kgschool.de
            <br />
            Telefon: +49 (0)241 000000
          </p>
          <p>
            <strong>Vertretungsberechtigt:</strong>
            <br />
            Max Mustermann (Geschaeftsfuehrung)
          </p>
          <p>
            <strong>Registereintrag:</strong>
            <br />
            Amtsgericht Aachen, HRB 00000
          </p>
          <p>
            <strong>Umsatzsteuer-ID:</strong>
            <br />
            DE000000000
          </p>
        </section>
      </div>
    </main>
  )
}

