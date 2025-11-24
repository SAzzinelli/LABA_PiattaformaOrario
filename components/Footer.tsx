export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-laba-primary text-white mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="font-semibold text-lg mb-1">LABA Firenze</p>
            <p className="text-sm opacity-90">Piattaforma Orario Lezioni</p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm opacity-75">
              © {currentYear} LABA Firenze. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

