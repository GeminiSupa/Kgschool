import Link from 'next/link'

export const metadata = {
  title: 'Datenschutz | Kid Cloud',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-slate-900 dark:text-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/" className="text-sm text-aura-primary hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--aura-primary)/25 rounded-md px-1">
          ← Zurueck zur Startseite
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Datenschutzerklaerung</h1>
        <p className="mt-3 text-sm text-ui-muted">Stand: 2026-03-27</p>

        <section className="mt-8 space-y-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
          <p>
            Diese Datenschutzerklaerung informiert ueber die Verarbeitung personenbezogener Daten im Zusammenhang mit
            der Nutzung von Kid Cloud. Verantwortlicher Anbieter der Plattform ist die ZAHA GLOBAL GmbH, soweit keine
            abweichende Verantwortlichkeit der jeweiligen Kita, des Traegers oder einer anderen nutzenden Organisation
            besteht.
          </p>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">1. Verantwortliche Stelle</h2>
          <p>
            ZAHA GLOBAL GmbH
            <br />
            ZAHA GLOBAL UG
            <br />
            Adolfstr. 32, D-52134 Herzogenrath
            <br />
            Deutschland
            <br />
            E-Mail: info@zahaglobal.co
            <br />
            Telefon: +49 170 9057 359
            <br />
            Website: https://zahaglobal.co/
            <br />
            Register: Amtsgericht Aachen, HRB 27903
            <br />
            EUID: DER3101.HRB27903
          </p>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">1. Verarbeitungszwecke</h2>
          <p>
            Kid Cloud wird fuer die Organisation des Kita- und Traegerbetriebs eingesetzt. Dazu gehoeren insbesondere
            Betreuung, Kommunikation mit Sorgeberechtigten, Vertragsverwaltung, Abrechnung, Personaleinsatzplanung,
            Dokumentation, digitale Freigaben, Sicherheitsprotokolle und die Erfuellung gesetzlicher Nachweis- und
            Meldepflichten.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">2. Kategorien von Daten</h2>
          <p>
            Stammdaten von Kindern, Sorgeberechtigten und Mitarbeitenden, Betreuungs-/Vertragsdaten, Anwesenheit,
            Gesundheits- und Ernaehrungshinweise soweit erforderlich, Kommunikationsinhalte, Abrechnungsdaten sowie
            technische Nutzungs- und Sicherheitsprotokolle.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">3. Rechtsgrundlagen</h2>
          <p>
            Art. 6 Abs. 1 lit. b, c, e DSGVO; Art. 9 Abs. 2 DSGVO soweit erforderlich; einschlaegige Fachgesetze
            (u. a. SGB VIII, KiBiz NRW) sowie Einwilligungen gemaess Art. 6 Abs. 1 lit. a DSGVO.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">4. Empfaenger und Auftragsverarbeitung</h2>
          <p>
            Personenbezogene Daten werden nur an solche Empfaenger uebermittelt, die fuer den Betrieb und die
            Bereitstellung der Plattform erforderlich sind. Sofern ZAHA GLOBAL GmbH als Auftragsverarbeiter fuer eine
            Kita oder einen Traeger taetig wird, erfolgt die Verarbeitung ausschliesslich auf dokumentierte Weisung und
            auf Grundlage eines Auftragsverarbeitungsvertrags gemaess Art. 28 DSGVO.
          </p>
          <p>
            ZAHA GLOBAL GmbH ist nach eigenem Unternehmensauftritt international taetig und betreibt Marken und
            Softwareloesungen mit Standorten beziehungsweise Aktivitaeten in Deutschland, Pakistan und Australien. Fuer
            Kid Cloud gelten dabei die vertraglich vereinbarten datenschutzrechtlichen Rollen und Verantwortlichkeiten.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">5. Speicherung und Loeschung</h2>
          <p>
            Daten werden nur so lange gespeichert, wie dies fuer den Zweck oder gesetzliche Aufbewahrungsfristen
            erforderlich ist. Danach erfolgt Loeschung oder Anonymisierung.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">6. Betroffenenrechte</h2>
          <p>
            Auskunft, Berichtigung, Loeschung, Einschraenkung, Datenuebertragbarkeit und Widerspruch nach Art. 15-21
            DSGVO. Anfragen koennen ueber die verantwortliche Stelle oder Datenschutzbeauftragte eingereicht werden.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">7. Sicherheit</h2>
          <p>
            Transportverschluesselung (TLS), rollenbasierte Zugriffe, Protokollierung sicherheitsrelevanter Aktionen,
            Backups und Incident-Management gemaess TOMs.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">8. Beschwerden bei Aufsichtsbehoerden</h2>
          <p>
            Betroffene Personen haben das Recht, sich bei einer Datenschutzaufsichtsbehoerde zu beschweren, wenn sie
            der Ansicht sind, dass die Verarbeitung ihrer personenbezogenen Daten nicht rechtmaessig erfolgt.
          </p>
        </section>
      </div>
    </main>
  )
}

