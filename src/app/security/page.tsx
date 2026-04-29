import Link from 'next/link'

export const metadata = {
  title: 'Security & Compliance | Kid Cloud',
}

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-background text-slate-900 dark:text-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link href="/" className="text-sm text-aura-primary hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--aura-primary)/25 rounded-md px-1">
          ← Zurueck zur Startseite
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Security, Ethik und Compliance</h1>
        <p className="mt-3 text-sm text-ui-muted">
          Kid Cloud wird von der Zaha Global GmbH mit Fokus auf Datenschutz, Mandantentrennung und belastbare
          Betriebsprozesse entwickelt und betrieben. Diese Seite gibt einen kompakten Ueberblick ueber unser
          Sicherheits- und Compliance-Verstaendnis.
        </p>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold">Datenschutz (DSGVO)</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
              <li>Auftragsverarbeitung (AVV) nach Art. 28 DSGVO</li>
              <li>Rollenbasierte Zugriffskontrolle und Mandantentrennung</li>
              <li>Datenminimierung und Zweckbindung</li>
              <li>Loesch- und Aufbewahrungskonzepte</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold">Technische Sicherheit</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
              <li>TLS-Verschluesselung fuer Datenuebertragung</li>
              <li>Backup- und Wiederherstellungsprozesse</li>
              <li>Auditierbare Admin- und Sicherheitsereignisse</li>
              <li>Incident-Management und definierte Eskalationspfade</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold">Ethische Datenverarbeitung</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
              <li>Keine versteckte Profilbildung mit Kinderdaten</li>
              <li>Transparente Einwilligungen und Widerrufsmoeglichkeiten</li>
              <li>Nachvollziehbarkeit automatisierter Regeln</li>
              <li>Human-in-the-loop fuer paedagogische Entscheidungen</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold">Betrieb fuer Kommunen</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
              <li>Mehrstandortfaehig fuer Traeger und Stadtverbuende</li>
              <li>Berichtswesen fuer Jugendamt und Tragerleitungen</li>
              <li>Export-/Importpfade fuer Altdatenmigration</li>
              <li>Schulungs- und Rolloutkonzept in Phasen</li>
            </ul>
          </article>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6 text-sm leading-6 text-slate-700 dark:text-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Sicherheitsgrundsaetze von Kid Cloud</h2>
          <p className="mt-3">
            Wir verfolgen einen risikobasierten Ansatz fuer den Schutz von Vertraulichkeit, Integritaet und
            Verfuegbarkeit. Dazu gehoeren rollenbasierte Berechtigungen, Protokollierung relevanter Systemaktionen,
            technische Zugangssicherungen, regelmaessige Wartung sowie ein strukturierter Umgang mit Sicherheitsvorfaellen.
          </p>
          <p className="mt-3">
            Organisatorisch wird der Zugriff auf produktive Daten auf berechtigte Rollen begrenzt. Vertragliche und
            datenschutzrechtliche Anforderungen fuer Kunden aus dem Bildungs- und Kita-Umfeld werden ueber geeignete
            Dokumente wie Datenschutzhinweise, TOMs und AVV/DPA-Prozesse begleitet.
          </p>
          <p className="mt-3">
            Fuer allgemeine Rueckfragen kann derzeit die zentrale Unternehmensadresse <strong>info@zahaglobal.co</strong>
            sowie die auf der Unternehmenswebseite genannte Telefonnummer <strong>+49 170 9057 359</strong> genutzt
            werden. Fuer den Live-Betrieb empfiehlt sich zusaetzlich eine dedizierte Sicherheits- oder
            Datenschutzkontaktadresse.
          </p>
        </section>
      </div>
    </main>
  )
}

