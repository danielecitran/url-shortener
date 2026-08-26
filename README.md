# shortr.ch | URL Shortener

Moderne Web-App zum Kürzen langer URLs. Nutzer können sich registrieren oder per Google anmelden, Short-Links erzeugen und Klicks nachverfolgen. Das Projekt besteht aus einem **Next.js**-Frontend und einem **Spring Boot**-Backend mit **PostgreSQL**.

| | |
|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Framer Motion |
| **Backend** | Spring Boot 4, Java 21, Spring Security, JPA |
| **Datenbank** | PostgreSQL |
| **Auth** | E-Mail/Passwort + Google Sign-In (JWT in HttpOnly-Cookie) |

---

## Features

- Lange URLs in 6-stellige Short-Codes kürzen (`a–z`, `0–9`)
- HTTP-Redirect (`302 Found`) auf die Original-URL inkl. Klickzähler
- Registrierung & Login mit E-Mail und Passwort (BCrypt)
- Google Sign-In (ID-Token-Verifikation im Backend)
- JWT-Session als HttpOnly-Cookie (`auth_token`, Standard: 7 Tage)
- E-Mail-Verfügbarkeitsprüfung bei der Registrierung
- Übersicht der eigenen Links
- Seiten: Landingpage, Anmelden/Registrieren, Dashboard,Impressum & Datenschutz
- Responsive UI

---

## Architektur

```
┌─────────────────┐         REST + Cookies          ┌──────────────────┐
│  Next.js (3000) │ ──────────────────────────────► │ Spring Boot      │
│  frontend/      │ ◄────────────────────────────── │ backend/ (8080)  │
└─────────────────┘         CORS credentials         └────────┬─────────┘
                                                              │
                                                              ▼
                                                     ┌──────────────────┐
                                                     │   PostgreSQL     │
                                                     │   urlshortener   │
                                                     └──────────────────┘
```

Short-Links werden über das Backend ausgeliefert:

```text
GET http://localhost:8080/{shortCode}  →  302 → originalUrl
```

---

## Projektstruktur

```text
url-shortener/
├── frontend/                 # Next.js App (App Router)
│   ├── app/                  # Seiten: Landing, Auth, Dashboard, Legal
│   ├── components/           # UI (Header, Auth, Modal, …)
│   └── lib/                  # API-Client, Auth-Context, Google Auth
├── backend/                  # Spring Boot API
│   └── src/main/java/com/daniele/url_shortener/
│       ├── auth/             # Register, Login, Google, Logout
│       ├── link/             # Short-Links & Redirect
│       ├── user/             # User-Entity & Repository
│       ├── security/         # JWT, Filter, Security-Config
│       └── common/           # Fehlerbehandlung
├── MVP.pdf                   # Produktbeschreibung (MVP)
├── Datenmodell.vsdx          # Datenmodell (Visio)
└── README.md
```

---

## Voraussetzungen

- **Node.js** 20+ (empfohlen) und npm
- **Java** 21
- **Maven** (oder mitgeliefertem `./mvnw` im Backend)
- **PostgreSQL** 14+ mit einer leeren Datenbank `urlshortener`
- Optional: Google Cloud OAuth-Client für Sign-In

---

## Schnellstart

### 1. Datenbank

```sql
CREATE DATABASE urlshortener;
```

Standard-Verbindung in der Dev-Config:

```text
jdbc:postgresql://localhost:5432/urlshortener
Benutzer: postgres
```

### 2. Backend starten

```bash
cd backend
./mvnw spring-boot:run
```

API läuft unter [http://localhost:8080](http://localhost:8080).

Schema-Updates laufen über Hibernate (`spring.jpa.hibernate.ddl-auto=update`).

### 3. Frontend starten

```bash
cd frontend
npm install
npm run dev
```

App unter [http://localhost:3000](http://localhost:3000).

### 4. Frontend-Umgebungsvariablen

Lege `frontend/.env.local` an:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_CLIENT_ID=dein-google-client-id.apps.googleusercontent.com
```

Ohne `NEXT_PUBLIC_API_URL` wird standardmäßig `http://localhost:8080` verwendet.

---

## Backend-Konfiguration

Aktuelle Einstellungen liegen in `backend/src/main/resources/application.properties`:

| Property | Beschreibung | Dev-Default |
|---|---|---|
| `spring.datasource.url` | PostgreSQL-JDBC-URL | `jdbc:postgresql://localhost:5432/urlshortener` |
| `spring.datasource.username` | DB-User | `postgres` |
| `spring.datasource.password` | DB-Passwort | *(leer)* |
| `server.port` | API-Port | `8080` |
| `app.jwt.secret` | Signatur-Secret für JWT | *(lokal gesetzt)* |
| `app.jwt.expiration-days` | Cookie-/Token-Laufzeit | `7` |
| `app.jwt.cookie-name` | Cookie-Name | `auth_token` |
| `app.cookie.secure` | `Secure`-Flag (HTTPS) | `false` |
| `app.google.client-id` | Google OAuth Client ID | *(lokal gesetzt)* |
| `app.base-url` | Basis-URL für Short-Links | `http://localhost:8080` |

> **Hinweis:** Secrets (JWT, Google Client ID, DB-Passwort) nicht committen. Für Produktion über Umgebungsvariablen oder ein Secret-Store setzen und `app.cookie.secure=true` aktivieren.

CORS erlaubt Credentials von `http://localhost:3000` und `http://127.0.0.1:3000`.

---

## Datenmodell

### `users`

| Spalte | Typ | Beschreibung |
|---|---|---|
| `user_id` | BIGINT PK | Auto-Increment |
| `first_name` | VARCHAR | Vorname |
| `last_name` | VARCHAR | Nachname |
| `email` | VARCHAR UNIQUE | Login-E-Mail |
| `google_sub` | VARCHAR UNIQUE | Google Subject (optional) |
| `password_hash` | VARCHAR | BCrypt-Hash |

### `links`

| Spalte | Typ | Beschreibung |
|---|---|---|
| `link_id` | BIGINT PK | Auto-Increment |
| `original_url` | VARCHAR | Normalisierte Ziel-URL |
| `short_code` | VARCHAR UNIQUE | 6 Zeichen (`a–z0–9`) |
| `click_count` | BIGINT | Aufrufe über Redirect |
| `created_at` | TIMESTAMP | Erstellzeitpunkt |
| `user_id` | FK → `users` | Eigentümer |

Visuelle Darstellung: `Datenmodell.vsdx`.

---

## API-Referenz

Basis-URL: `http://localhost:8080`  
Authentifizierte Endpunkte erwarten das Cookie `auth_token` (`credentials: "include"` im Browser).

### Auth — `/api/auth`

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `POST` | `/api/auth/register` | nein | Benutzer anlegen |
| `POST` | `/api/auth/login` | nein | Login, setzt Cookie |
| `POST` | `/api/auth/google` | nein | Google Login / Registrierung |
| `POST` | `/api/auth/logout` | nein | Cookie löschen |
| `GET` | `/api/auth/me` | ja | Aktueller Benutzer |
| `GET` | `/api/auth/email-availability?email=` | nein | E-Mail frei? |

**Registrierung** — `POST /api/auth/register`

```json
{
  "firstName": "Max",
  "lastName": "Muster",
  "email": "max@example.com",
  "password": "mindestens8zeichen"
}
```

Antwort `201`:

```json
{ "userId": 1, "message": "Registrierung erfolgreich" }
```

**Login** — `POST /api/auth/login`

```json
{ "email": "max@example.com", "password": "mindestens8zeichen" }
```

**Google** — `POST /api/auth/google`

```json
{
  "idToken": "<google-id-token>",
  "rememberMe": true,
  "firstName": "Max",
  "lastName": "Muster"
}
```

`firstName` / `lastName` nur nötig, wenn das Google-Profil unvollständig ist (`PROFILE_INCOMPLETE`).

### Links — `/api/links`

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `POST` | `/api/links` | ja | Short-Link erzeugen |
| `GET` | `/api/links/me` | ja | Eigene Links (neueste zuerst) |

**Anlegen** — `POST /api/links`

```json
{ "originalUrl": "https://example.com/sehr/langer/pfad" }
```

Antwort `201`:

```json
{
  "linkId": 12,
  "originalUrl": "https://example.com/sehr/langer/pfad",
  "shortCode": "a1b2c3",
  "shortUrl": "http://localhost:8080/a1b2c3",
  "clickCount": 0,
  "createdAt": "2026-08-26T11:00:00"
}
```

URLs ohne Schema werden als `http://…` normalisiert; nur `http`/`https` sind erlaubt.

### Redirect

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `GET` | `/{shortCode}` | nein | `302` auf Original-URL, erhöht `click_count` |

`shortCode` muss genau 6 alphanumerische Zeichen sein.

### Fehlerformat

```json
{
  "code": "VALIDATION_ERROR",
  "message": "E-Mail ist ungültig"
}
```

Wichtige Codes:

| Code | HTTP | Bedeutung |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Ungültige Eingabe |
| `INVALID_URL` | 400 | URL ungültig |
| `EMAIL_ALREADY_EXISTS` | 409 | E-Mail vergeben |
| `PROFILE_INCOMPLETE` | 409 | Google-Profil unvollständig |
| `INVALID_CREDENTIALS` | 401 | Login fehlgeschlagen |
| `GOOGLE_AUTH_FAILED` | 401 | Google-Token ungültig |
| `USER_NOT_FOUND` | 404 | Benutzer fehlt |
| `SHORT_CODE_NOT_FOUND` | 404 | Unbekannter Short-Code |

---

## Frontend-Routen

| Route | Beschreibung |
|---|---|
| `/` | Landingpage mit URL-Kürzungs-Modal |
| `/anmelden` | Login |
| `/registrieren` | Registrierung |
| `/abmelden` | Logout |
| `/dashboard` | Geschützter Bereich (Platzhalter) |
| `/impressum` | Impressum |
| `/datenschutz` | Datenschutz |

API-Aufrufe laufen über `frontend/lib/api-client.ts` mit Cookie-Credentials.

---

## Entwicklung

```bash
# Frontend
cd frontend && npm run dev      # Dev-Server
cd frontend && npm run lint     # ESLint
cd frontend && npm run build    # Production-Build

# Backend
cd backend && ./mvnw spring-boot:run
cd backend && ./mvnw test
```

### Typischer Dev-Flow

1. PostgreSQL starten und DB `urlshortener` anlegen  
2. Backend auf Port `8080` starten  
3. `frontend/.env.local` setzen  
4. Frontend auf Port `3000` starten  
5. Im Browser registrieren → Link kürzen → Short-URL aufrufen  

---

## Sicherheit (Kurzüberblick)

- Passwörter nur als BCrypt-Hash
- JWT in HttpOnly-, SameSite=Lax-Cookie (kein LocalStorage)
- CSRF für die Cookie-API in Dev deaktiviert; CORS auf bekannte Origins beschränkt
- Öffentliche Endpunkte explizit freigegeben; Rest authentifiziert
- Google-ID-Token serverseitig prüfen (Client-ID muss Frontend und Backend matchen)

Für Produktion: starkes JWT-Secret, HTTPS, `app.cookie.secure=true`, restriktive CORS-Origins.

---

## Dokumentation & Planung

| Datei | Inhalt |
|---|---|
| `MVP.pdf` | Minimum Viable Product — Anforderungen & Scope |
| `Datenmodell.vsdx` | Entity-Beziehung (Visio) |

---

## Lizenz / Status

Privates Projekt
