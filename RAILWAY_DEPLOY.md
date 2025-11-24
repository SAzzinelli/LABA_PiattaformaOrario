# Deploy su Railway

Guida per il deploy della piattaforma LABA Orario su Railway.

## Prerequisiti

1. Account Railway: https://railway.app
2. Repository GitHub collegato
3. Supabase configurato (vedi [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))

## Passaggi per il Deploy

### 1. Collega il Repository GitHub

1. Vai su https://railway.app
2. Clicca su **"New Project"**
3. Seleziona **"Deploy from GitHub repo"**
4. Autorizza Railway ad accedere al tuo GitHub
5. Seleziona il repository `SAzzinelli/LABA_PiattaformaOrario`

### 2. Configura le Variabili d'Ambiente

Nel dashboard Railway, vai su **Variables** e aggiungi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tmyrmyimdqrzrmoaqwld.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_mx0nhQlgqafufc-vc_sN8w_7BNmaEpn
SUPABASE_SERVICE_ROLE_KEY=sb_secret_WKCEm5j43h9lKISdgRxLaA_IlQsaoms
DATABASE_URL=postgresql://postgres.tmyrmyimdqrzrmoaqwld:Labafirenze26!@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
JWT_SECRET=32f2be51a0bdc5a6fc56d36d3e39ebb88b1af470bd3898033b333d63cab639165f13ce6be245cc76919f53d347c0f26a2e69f04b6803a4e0104b8f3ad8cffb58
NODE_ENV=production
```

**⚠️ IMPORTANTE**: 
- Genera un `JWT_SECRET` sicuro e unico per produzione (usa un generatore di stringhe casuali)
- NON usare lo stesso JWT_SECRET di sviluppo

### 3. Configura il Build

Railway rileverà automaticamente Next.js e userà:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

Se necessario, puoi verificare la configurazione in `railway.json`.

### 4. Deploy Automatico

Railway farà automaticamente:
1. Build dell'applicazione ad ogni push su `main`
2. Deploy della nuova versione
3. Restart automatico in caso di errori

### 5. Configura il Dominio (Opzionale)

1. Nel dashboard Railway, vai su **Settings** > **Domains**
2. Aggiungi un dominio personalizzato o usa quello fornito da Railway
3. Configura il DNS se necessario

## Verifica Post-Deploy

1. **Testa l'URL di produzione** fornito da Railway
2. **Verifica il login admin**: `admin@labafirenze.com` / `laba2025`
3. **Aggiungi una lezione di test**
4. **Verifica tutte le viste del calendario**

## Monitoraggio

Railway fornisce:
- **Logs**: Visualizza i log in tempo reale nel dashboard
- **Metrics**: Monitora CPU, memoria, traffico
- **Deployments**: Storico di tutti i deploy

## Troubleshooting

### Build Fallisce
- Verifica che tutte le variabili d'ambiente siano configurate
- Controlla i log per errori specifici
- Assicurati che `package.json` abbia tutti gli script necessari

### Errore di Connessione a Supabase
- Verifica che le chiavi API siano corrette
- Controlla che lo schema SQL sia stato eseguito su Supabase
- Verifica che RLS policies siano configurate correttamente

### App Non Si Avvia
- Controlla i log Railway per errori
- Verifica che `NODE_ENV=production` sia impostato
- Assicurati che il build sia completato con successo

## Aggiornamenti

Per aggiornare l'applicazione:
1. Fai push su GitHub
2. Railway rileverà automaticamente le modifiche
3. Farà un nuovo build e deploy automaticamente

## Sicurezza Produzione

⚠️ **Checklist Sicurezza**:
- [ ] JWT_SECRET unico e sicuro generato
- [ ] Tutte le variabili d'ambiente configurate
- [ ] RLS abilitato su Supabase
- [ ] Service Role Key usata solo server-side
- [ ] HTTPS abilitato (automatico su Railway)
- [ ] Dominio personalizzato configurato (opzionale ma consigliato)

