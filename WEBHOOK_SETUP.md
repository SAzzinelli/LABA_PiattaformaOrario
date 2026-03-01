# Sync e Pubblicazione GitHub

## Sync automatico (GitHub → Piattaforma)

Quando modifichi i JSON degli orari nel repo **LABA_Orari** su GitHub, la piattaforma può sincronizzarsi automaticamente senza dover cliccare "Sync" da Admin.

## Configurazione

### 1. Genera un secret per il webhook

```bash
openssl rand -hex 32
```

Copia il risultato (es. `a1b2c3d4e5f6...`).

### 2. Aggiungi la variabile su Railway

1. Vai su Railway → progetto Piattaforma Orario
2. **Variables** → Add Variable
3. Nome: `GITHUB_WEBHOOK_SECRET`
4. Valore: incolla il secret generato
5. Salva (Railway farà un redeploy)

### 3. Configura il webhook su GitHub

1. Apri il repo **LABA_Orari** su GitHub
2. **Settings** → **Webhooks** → **Add webhook**
3. Compila:
   - **Payload URL**: `https://orario.laba.biz/api/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: incolla lo stesso secret usato su Railway
   - **Which events?**: "Just the push event"
4. **Add webhook**

### 4. Verifica

Dopo aver creato il webhook, GitHub invia un "ping" per testare. Controlla che compaia un segno verde (✓) accanto al webhook. In caso di errore, controlla i "Recent Deliveries" per vedere la risposta del server.

## Comportamento

- **Nessun doppione**: il sync elimina le lezioni esistenti per corso+anno e reinserisce i dati da GitHub. Non si creano duplicati.
- **Solo push su main**: il sync parte solo quando fai push sul branch `main` (o `master`) di LABA_Orari.
- **Risposta immediata**: la piattaforma risponde subito a GitHub (entro pochi secondi) e esegue il sync in background.

---

## Pubblicazione su GitHub (Piattaforma → GitHub)

Quando modifichi le lezioni su orario.laba.biz, puoi pubblicarle su LABA_Orari con il pulsante **"Pubblica su GitHub"** nella sezione Admin → Orari.

### Configurazione

1. **Crea un Personal Access Token su GitHub**
   - GitHub → Settings → Developer settings → Personal access tokens
   - Generate new token (classic)
   - Permessi: `repo` (accesso completo ai repository)
   - Copia il token

2. **Aggiungi su Railway**
   - Variables → Add Variable
   - Nome: `GITHUB_TOKEN`
   - Valore: il token generato

3. **Opzionale** – Anno accademico per le date dei semestri
   - Nome: `GITHUB_EXPORT_YEAR_START`
   - Valore: `2025` (anno di inizio dell’anno accademico 2025-26)
   - Default: anno corrente se non impostato
