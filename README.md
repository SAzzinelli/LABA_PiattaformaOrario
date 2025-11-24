# LABA - Piattaforma Orario Lezioni

Piattaforma web per la gestione e consultazione degli orari delle lezioni settimanali per LABA Firenze.

## 🚀 Funzionalità

- **Calendario Multi-vista**: Giorno, Settimana, Mese, Anno
- **Gestione Lezioni**: Aggiungi, modifica, elimina lezioni (solo admin)
- **Autenticazione Admin**: Accesso protetto per modifiche
- **Design Responsive**: Interfaccia moderna con colori LABA
- **Database Supabase**: PostgreSQL cloud-based

## 📋 Requisiti

- Node.js 18+ 
- npm o yarn
- Account Supabase

## 🛠️ Setup e Deploy

### Configurazione Supabase

1. **Esegui lo schema SQL**
   - Vai su https://app.supabase.com
   - Seleziona il progetto `tmyrmyimdqrzrmoaqwld`
   - Apri **SQL Editor** e esegui `supabase/schema.sql`
   
   Vedi la guida completa in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### Deploy su Railway

1. **Collega il repository GitHub a Railway**
   - Vai su https://railway.app
   - Crea un nuovo progetto da GitHub
   - Seleziona questo repository

2. **Configura le variabili d'ambiente in Railway**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tmyrmyimdqrzrmoaqwld.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_mx0nhQlgqafufc-vc_sN8w_7BNmaEpn
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_WKCEm5j43h9lKISdgRxLaA_IlQsaoms
   DATABASE_URL=postgresql://postgres.tmyrmyimdqrzrmoaqwld:Labafirenze26!@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
   JWT_SECRET=genera-una-chiave-sicura-per-produzione
   NODE_ENV=production
   ```

3. **Railway farà automaticamente build e deploy**

Vedi la guida completa in [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)

## 🔐 Credenziali Admin

- **Email**: `admin@labafirenze.com`
- **Password**: `laba2025`

L'admin viene creato automaticamente al primo login.

## 📁 Struttura del Progetto

```
LABA_PiattaformaOrario/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Autenticazione
│   │   └── lessons/       # CRUD lezioni
│   ├── layout.tsx         # Layout principale
│   └── page.tsx           # Homepage
├── components/            # Componenti React
│   ├── CalendarView.tsx  # Vista calendario principale
│   ├── LessonCard.tsx     # Card lezione
│   ├── LessonForm.tsx    # Form creazione/modifica
│   ├── LoginModal.tsx    # Modal login
│   └── ViewSelector.tsx  # Selettore vista
├── lib/                   # Utilities
│   ├── auth.ts           # Autenticazione JWT
│   ├── db.ts             # Database operations
│   └── supabase.ts       # Client Supabase
├── supabase/
│   └── schema.sql        # Schema database
└── package.json
```

## 🎨 Colori Tema

- **Primario LABA**: `#033157`
- **Lunedì**: `#FF6B6B` (Rosso)
- **Martedì**: `#4ECDC4` (Turchese)
- **Mercoledì**: `#45B7D1` (Blu)
- **Giovedì**: `#FFA07A` (Arancione)
- **Venerdì**: `#98D8C8` (Verde)
- **Sabato**: `#F7DC6F` (Giallo)
- **Domenica**: `#BB8FCE` (Viola)

## 📝 Scripts Disponibili

- `npm run dev` - Avvia il server di sviluppo
- `npm run build` - Crea il build di produzione
- `npm start` - Avvia il server di produzione (dopo build)
- `npm run lint` - Esegue il linter

## 🗄️ Database

Il progetto usa **Supabase PostgreSQL** con le seguenti tabelle:

- **lessons**: Lezioni con titolo, orario, aula, professore, gruppo, note
- **admin_users**: Utenti admin con email e password hash

Vedi `supabase/schema.sql` per lo schema completo.

## 🚢 Deploy

Il progetto è configurato per il deploy su **Railway** con **Supabase** come database.

- **Hosting**: Railway (deploy automatico da GitHub)
- **Database**: Supabase PostgreSQL (cloud)
- **Nessun file locale**: Tutto è cloud-based

Vedi [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) per la guida completa al deploy.

## 🔒 Sicurezza

- Le password admin sono hashate con bcrypt
- JWT per autenticazione sessioni
- Row Level Security (RLS) su Supabase
- Service Role Key usata solo server-side
- Variabili d'ambiente per credenziali sensibili

## 📄 Licenza

Proprietario - LABA Firenze

## 👥 Supporto

Per problemi o domande, apri una issue su GitHub.

