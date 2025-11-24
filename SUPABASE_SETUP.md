# Setup Supabase per LABA Piattaforma Orario

## Passaggi per configurare Supabase

### 1. Eseguire lo Schema SQL

1. Vai al dashboard Supabase: https://app.supabase.com
2. Seleziona il progetto `tmyrmyimdqrzrmoaqwld`
3. Vai su **SQL Editor** nel menu laterale
4. Crea una nuova query
5. Copia e incolla il contenuto di `supabase/schema.sql`
6. Esegui la query (Run)

Questo creerà:
- Tabella `lessons` per le lezioni
- Tabella `admin_users` per gli admin
- Indici per performance
- Trigger per aggiornare `updated_at`
- Row Level Security (RLS) policies

### 2. Ottenere le API Keys

1. Nel dashboard Supabase, vai su **Settings** > **API**
2. **IMPORTANTE**: Usa le **NUOVE chiavi** (non quelle legacy)
3. Trova nella sezione "Project API keys":
   - **Project URL**: `https://tmyrmyimdqrzrmoaqwld.supabase.co`
   - **anon/public key**: La chiave pubblica (etichettata come "anon" o "public" - sicura per il client)
   - **service_role key**: La chiave privata (etichettata come "service_role" - SOLO per server-side, molto sensibile!)
   
   ⚠️ **Nota**: Se vedi sia "Legacy keys" che "New keys", usa sempre le **New keys** (più sicure e moderne)

### 3. Configurare le Variabili d'Ambiente

1. Crea un file `.env.local` nella root del progetto (se non esiste già)
2. Copia il contenuto da `.env.example`
3. Compila i valori:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tmyrmyimdqrzrmoaqwld.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=la-tua-anon-key
SUPABASE_SERVICE_ROLE_KEY=la-tua-service-role-key
DATABASE_URL=postgresql://postgres.tmyrmyimdqrzrmoaqwld:Labafirenze26!@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
JWT_SECRET=genera-una-chiave-casuale-sicura
```

### 4. Inizializzare l'Admin

L'admin viene creato automaticamente al primo accesso, oppure puoi eseguire manualmente:

```sql
-- Nel SQL Editor di Supabase
INSERT INTO admin_users (email, password_hash)
VALUES ('admin@labafirenze.com', '$2a$10$...')
ON CONFLICT (email) DO NOTHING;
```

**Nota**: La password hash viene generata automaticamente dal codice. Le credenziali di default sono:
- Email: `admin@labafirenze.com`
- Password: `laba2025`

### 5. Verifica la Configurazione

Dopo il deploy su Railway:
1. Accedi all'URL di produzione fornito da Railway
2. Prova a fare login come admin (`admin@labafirenze.com` / `laba2025`)
3. L'admin verrà creato automaticamente al primo login
4. Aggiungi una lezione di test per verificare che tutto funzioni

## Troubleshooting

### Errore: "relation does not exist"
- Assicurati di aver eseguito lo schema SQL nel SQL Editor

### Errore: "Invalid API key"
- Verifica che le chiavi in `.env.local` siano corrette
- Controlla che non ci siano spazi extra
- Assicurati di usare le **NUOVE chiavi** (non legacy) da Settings > API
- Verifica di aver copiato l'intera chiave (sono stringhe molto lunghe)

### Errore: "Row Level Security policy violation"
- Verifica che le policies RLS siano state create correttamente
- Per sviluppo, puoi temporaneamente disabilitare RLS:
  ```sql
  ALTER TABLE lessons DISABLE ROW LEVEL SECURITY;
  ```

### Admin non può fare login
- Verifica che l'admin sia stato creato nella tabella `admin_users`
- Controlla che la password hash sia corretta (viene generata automaticamente)

## Sicurezza

⚠️ **IMPORTANTE**:
- **NON** committare mai il file `.env.local` nel repository
- La `SUPABASE_SERVICE_ROLE_KEY` bypassa tutte le policies RLS - usala solo server-side
- Genera un `JWT_SECRET` sicuro per produzione (usa un generatore di stringhe casuali)

## Migrazione da JSON a Supabase

I dati esistenti nel file `data/lessons.json` possono essere migrati eseguendo uno script di migrazione (da creare se necessario).

