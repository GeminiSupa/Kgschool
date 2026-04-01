# Mehrsprachigkeit & einheitliche Meldungen im Kita-Portal

**Kurzdokument für Leitung, Träger und IT**  
*Stand: April 2026*

---

## 1. Was wurde umgesetzt?

Die **Benutzeroberfläche** der Anwendung wird systematisch **mehrsprachig** ausgebaut. Schwerpunkt war bisher:

- **Fehlermeldungen**, **Erfolgshinweise**, **Bestätigungsdialoge** (z. B. beim Speichern, Löschen, Genehmigen)
- **Lade- und Platzhaltertexte**, wo Nutzer sonst feste englische oder gemischte Texte gesehen hätten

Die Texte sind in **Deutsch**, **Englisch** und **Türkisch** hinterlegt und können über die **Spracheinstellung** in der App gewechselt werden (sofern die jeweilige Seite bereits angebunden ist).

---

## 2. Warum ist das wichtig für die Kita?

| Aspekt | Nutzen |
|--------|--------|
| **Eltern & Personal** | Verständliche Meldungen in der gewählten Sprache – weniger Verwirrung bei Fehlern oder Abläufen (z. B. Mittagessen, Abwesenheit, Nachrichten). |
| **Einheitlicher Auftritt** | Gleiche Vorgänge nutzen dieselben Formulierungen (z. B. „Antrag eingereicht“ statt wechselnder Einzeltexte). |
| **Erweiterbarkeit** | Neue Meldungen werden zentral gepflegt; Anpassungen (Wortwahl, Formulierung) sind ohne Programmierkenntnisse in den Übersetzungsdateien möglich. |
| **Barriere & Vertrauen** | Klare Sprache unterstützt besonders Familien, die nicht Deutsch als Erstsprache nutzen. |

---

## 3. Vollständige Funktionsübersicht des Portals

Nachfolgend alle **Module und Bereiche**, die die App laut aktueller Struktur abdeckt (unabhängig vom Übersetzungsstand der einzelnen Texte).

### 3.1 Öffentlich & Zugang

| Bereich | Inhalt |
|--------|--------|
| **Start / Landing** | Einstieg, Weiterleitung |
| **Anmeldung / Abmeldung** | Login, Logout, Registrierung, Signup, Bewerbung (Apply) |
| **Profil** | Eigenes Profil |
| **Unautorisiert** | Hinweis bei fehlenden Rechten |
| **Rechtliches & Vertrauen** | Datenschutz, Impressum, Sicherheit, AVV/DPA |
| **Öffentliche Kita-Website** | Seiten unter individuellem Slug (`/s/…`) – Inhalte aus dem Website-Builder |

### 3.2 Verwaltung (Admin)

| Modul | Funktionen (Auszug) |
|--------|---------------------|
| **Dashboard & Übersicht** | Admin-Dashboard |
| **Setup / Go-Live** | Checkliste (Gruppen, Kinder, Personal, Verträge, Gebühren, Lunch-Menüs) |
| **Website-Builder** | Öffentliche Seite, Slug, Veröffentlichung |
| **Kalender** | Verwaltungskalender |
| **Berichte** | Auswertungen |
| **Diagnose** | z. B. Lehrkräfte-Diagnose |
| **Benutzer** | Liste, anlegen, bearbeiten, deaktivieren, Dokumente |
| **Gruppen** | Liste, Gruppe anlegen, Detail, Stundenplan pro Gruppe |
| **Kinder** | Liste, Kind anlegen, Profil, Eltern verwalten, Gruppe wechseln, Lehrkräfte zuordnen |
| **Personal** | Liste, Personal anlegen, Profil, **Dienstplan (Rota)**, **Qualifikationen** |
| **Anwesenheit** | Übersicht, **Kalender-Ansicht** |
| **Nachrichten** | interne Kommunikation |
| **Bewerbungen / Warteliste** | Eingänge, Warteliste |
| **Verträge** | Übersicht, **neuer Vertrag** |
| **Einverständnisse** | Consents |
| **Tagesablauf** | Daily Routines (Übersicht, neu) |
| **Tagesberichte** | Liste, neu, Detail |
| **Beobachtungen** | Liste, neu, Detail |
| **Portfolios** | Liste, neu, Detail |
| **Bildungsbereiche** | Learning Themes (Liste, neu, Detail) |
| **Mittagessen** | Menüs (Liste, neu, Detail, Bearbeiten), Bestellungen, **Preise**, **Abrechnung** (Übersicht, Konfiguration, erzeugen, Detail, Berichte, Erstattungen, Abgleich, **Abrechnungs-Stundenpläne** inkl. neu/bearbeiten) |
| **Gebühren** | Übersicht, **erzeugen**, Konfiguration (Liste, neu, Detail), **Monatsgebühr-Detail** |
| **Elternarbeit** | Aufgaben, **neue Aufgabe**, Detail inkl. Einreichungen |
| **Urlaub / Abwesenheit** | Übersicht, **Antrag Kind** (Detail), **Antrag Personal** (Detail) |
| **Personalabrechnung (HR)** | **Gehaltskonfiguration** (Liste, neu, Detail), **Payroll** (Übersicht, erzeugen, Detail) |
| **Einstellungen** | Admin-Einstellungen |

### 3.3 Team / Erzieher (Teacher)

| Modul | Funktionen (Auszug) |
|--------|---------------------|
| **Dashboard** | Übersicht |
| **Aufgaben** | Todo |
| **Kinder** | Liste, **Detail** |
| **Gruppen** | **Gruppendetail** |
| **Anwesenheit** | Erfassung, **QR-Scan-Hinweis** (manuell nutzen) |
| **Tagesberichte** | Liste, neu, Detail |
| **Beobachtungen** | Liste, neu, Detail |
| **Portfolios** | Liste, neu, Detail |
| **Schlafprotokolle** | Liste, neu, Detail |
| **Kalender** | Termine |
| **Urlaub** | Anträge, neu |
| **Gehalt / Payroll** | Übersicht |
| **Nachrichten** | Kommunikation |

### 3.4 Eltern (Parent)

| Modul | Funktionen (Auszug) |
|--------|---------------------|
| **Dashboard** | Übersicht |
| **Kinder** | Liste, **Detailprofil** |
| **Kalender** | Termine |
| **Tagesberichte** | Liste, **Detail** |
| **Beobachtungen** | Übersicht |
| **Portfolios** | Übersicht |
| **Bildungsbereiche** | Learning Themes |
| **Elternarbeit** | Aufgaben / Mitarbeit |
| **Mittagessen** | Menüs, Bestellungen, Stornierung |
| **Gebühren & Abrechnung** | Gebührenübersicht, **Rechnungs-/Billing-Detail** |
| **Anwesenheit** | Status der Kinder |
| **Abwesenheiten** | Liste, **neue Anfrage** |
| **Urlaub / Abwesenheit** | Anträge, neu |
| **Nachrichten** | Posteingang / Gesendet |

### 3.5 Küche (Kitchen)

| Modul | Funktionen |
|--------|------------|
| **Dashboard** | Übersicht |
| **Menüs** | Menüverwaltung |
| **Bestellungen** | Tagesbestellungen, Status |

### 3.6 Support

| Modul | Funktionen |
|--------|------------|
| **Dashboard** | Übersicht |
| **Anwesenheit** | Erfassung, **Massen-Aktion „anwesend“** |
| **Kalender** | Terminübersicht |
| **Kinder** | Zugriff |
| **Nachrichten** | Kommunikation |
| **Berichte** | Auswertungen |
| **Payroll / Gehalt** | Übersicht |

---

## 4. Technische Kurzbeschreibung (für IT / Dienstleister)

- Übersetzungen liegen in strukturierten Dateien unter `src/i18n/` (u. a. `sharedErrorsFlat.ts` für gemeinsame Meldungen).
- Seiten nutzen die Funktionen `t(…)` (Übersetzung) und `sT(…)` (Schlüssel unter `pages.shared.*`).
- Platzhalter in Meldungen (z. B. `{{count}}`) werden bei Bedarf mit `fillTemplate` ersetzt.

**Bereiche, in denen zentrale Meldungen (Toast/Alert/Fehler/Confirm) bereits stärker angebunden sind** (Auszug, kein Anspruch auf Vollständigkeit jeder einzelnen Zeile UI-Text):

- **Admin:** Benutzer, Gruppen, Kinder (inkl. Eltern, Gruppenwechsel, Lehrer-Zuordnung), Personal, Mittagessen (Menüs, Abrechnung, Preise), Elternarbeit, Urlaub (Kind & Personal), Portfolios, Beobachtungen, Gebühren (inkl. KI-Erinnerung), Website-Einstellungen, Setup, Nachrichten, Kalender (Auszug), diverse HR-/Lunch-Unterseiten je nach Seite  
- **Eltern:** Kinder, Nachrichten, Mittagessen, Gebühren, Tagesberichte, Anwesenheit, neue Abwesenheitsanfrage  
- **Team:** Gruppen-/Kinder-Detail, Beobachtungen, Portfolios, Anwesenheit (inkl. QR-Hinweis)  
- **Support/Küche:** u. a. Anwesenheit (inkl. Massenmarkierung), Küchen-Bestellungen  

*Hinweis:* Nicht jede **Überschrift**, **Beschreibung** oder jeder **leere Zustand** auf allen oben genannten Seiten ist bereits in drei Sprachen hinterlegt; die **systematische Meldungs-Ebene** (Fehler/Erfolg) ist weiter als die Fließtexte aller Bildschirme.

---

## 5. Was ist noch offen / nächste sinnvolle Schritte?

- **Statische Seitentexte** (Überschriften, Erklärabsätze, leere Zustände wie „Keine Nachrichten“) sind teils noch nicht alle in alle Sprachen überführt – das kann in einer zweiten Phase erfolgen.
- **Konsistenz-Review** mit Pädagogik/Leitung: einheitliche Anrede („Sie“, „du“), Tonalität bei Fehlermeldungen.
- Bei **neuen Funktionen** sollten neue Meldungen direkt in den gemeinsamen Übersetzungslisten ergänzt werden.

---

## 6. Kontakt & Pflege

- Änderungen an Texten: bevorzugt in den **i18n-Dateien** bzw. über das vereinbarte Release-Verfahren mit der Entwicklung.  
- Für inhaltliche Vorgaben (z. B. Datenschutzhinweise, behördliche Formulierungen) ist die **Kita-Leitung / der Träger** zuständig.

---

*Dieses Dokument beschreibt den Stand der Arbeiten an der Mehrsprachigkeit und die **Funktionsumfänge** der Anwendung; es ersetzt keine vertragliche oder rechtliche Dokumentation.*
