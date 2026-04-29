import Link from 'next/link'

export const metadata = {
  title: 'Impressum | Kid Cloud',
}

export default function ImprintPage() {
  return (
    <main className="min-h-screen bg-background text-slate-900 dark:text-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/" className="text-sm text-aura-primary hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--aura-primary)/25 rounded-md px-1">
          ← Zurueck zur Startseite
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Impressum</h1>
        <p className="mt-3 text-sm text-ui-muted">Angaben gemaess § 5 DDG, § 18 Abs. 2 MStV und den allgemeinen Informationspflichten fuer digitale Dienste.</p>

        <section className="mt-8 space-y-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
          <p>
            <strong>Anbieter:</strong>
            <br />
            ZAHA GLOBAL GmbH
            <br />
            ZAHA GLOBAL UG
            <br />
            Adolfstr. 32, D-52134 Herzogenrath
            <br />
            Deutschland
          </p>
          <p>
            <strong>Kontakt:</strong>
            <br />
            E-Mail: info@zahaglobal.co
            <br />
            Telefon: +49 170 9057 359
            <br />
            Website: https://zahaglobal.co/
          </p>
          <p>
            <strong>Vertretungsberechtigt:</strong>
            <br />
            Geschaeftsfuehrung der ZAHA GLOBAL GmbH / ZAHA GLOBAL UG
          </p>
          <p>
            <strong>Registereintrag:</strong>
            <br />
            Amtsgericht Aachen, HRB 27903
            <br />
            EUID: DER3101.HRB27903
          </p>
          <p>
            <strong>Umsatzsteuer-ID:</strong>
            <br />
            Bitte USt-IdNr. ergaenzen, sofern vorhanden
          </p>
          <p>
            <strong>Inhaltlich verantwortlich gemaess § 18 Abs. 2 MStV:</strong>
            <br />
            ZAHA GLOBAL GmbH
            <br />
            Anschrift wie oben
          </p>
          <p>
            <strong>Unternehmensgegenstand (Object):</strong>
            <br />
            Object
          </p>
          <p>
            <strong>Hinweis zur Plattform:</strong>
            <br />
            Kid Cloud ist eine digitale Verwaltungs- und Kommunikationsplattform fuer Kitas, Traeger und Familien. Die Plattform wird von der ZAHA GLOBAL GmbH als Teil ihres Technologie- und Softwareportfolios entwickelt und betrieben. Inhalte, Produkttexte und Dokumentationen werden mit der gebotenen Sorgfalt gepflegt. Eine Gewaehr fuer jederzeitige Vollstaendigkeit, Richtigkeit und Aktualitaet allgemeiner Informationsseiten kann jedoch trotz regelmaessiger Pflege nicht uebernommen werden.
          </p>
          <p>
            <strong>Haftung fuer Links:</strong>
            <br />
            Externe Links werden bei erstmaliger Verlinkung auf erkennbare Rechtsverstoesse geprueft. Eine permanente inhaltliche Kontrolle verlinkter externer Seiten ist ohne konkrete Anhaltspunkte nicht zumutbar. Bei Bekanntwerden von Rechtsverstoessen werden derartige Links unverzueglich entfernt.
          </p>
        </section>
      </div>
    </main>
  )
}

