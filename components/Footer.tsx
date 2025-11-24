'use client'

export default function Footer() {
  const handleReportIssue = () => {
    const subject = encodeURIComponent('Incongruenza orario delle lezioni')
    const body = encodeURIComponent(`Gentile staff LABA,

ho riscontrato un'incongruenza nell'orario delle lezioni visualizzato sulla piattaforma.

Dettagli:
- Data: [specificare la data]
- Orario: [specificare l'orario]
- Aula: [specificare l'aula]
- Corso/Anno: [specificare se applicabile]

Descrizione del problema:
[descrivere qui l'incongruenza riscontrata]

Cordiali saluti.`)
    
    window.location.href = `mailto:info@laba.biz?subject=${subject}&body=${body}`
  }

  return (
    <footer className="bg-laba-primary text-white mt-auto shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm opacity-90 font-medium animate-fade-in">
            LABA Firenze 2026 - versione α 0.123
          </div>
          <button
            onClick={handleReportIssue}
            className="btn-modern px-6 py-2.5 rounded-full bg-white text-laba-primary text-sm font-medium shadow-md whitespace-nowrap relative overflow-hidden"
          >
            <span className="relative z-10">Segnala Incongruenza</span>
          </button>
        </div>
      </div>
    </footer>
  )
}
