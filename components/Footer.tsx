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
    <footer className="bg-laba-primary text-white mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-sm opacity-90">
            LABA Firenze 2026 - versione α 0.123
          </div>
          <button
            onClick={handleReportIssue}
            className="px-4 py-2 rounded-full bg-white text-laba-primary text-sm font-medium transition-all duration-200 hover:bg-gray-100 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md whitespace-nowrap"
          >
            Segnala Incongruenza
          </button>
        </div>
      </div>
    </footer>
  )
}
