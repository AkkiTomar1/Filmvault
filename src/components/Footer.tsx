import { FaFacebookF, FaXTwitter, FaInstagram } from 'react-icons/fa6'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 py-6 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 md:flex-row">
        <div className="text-center md:text-left">
          <h2 className="text-lg font-bold">Filmvault</h2>
          <p className="text-sm text-gray-400">© {year} Filmvault. Crafted by Akki.</p>
        </div>

        <div className="flex space-x-4">
          <LinkPlaceholder label="About" />
          <LinkPlaceholder label="Contact" />
          <LinkPlaceholder label="Privacy Policy" />
        </div>

        <div className="flex space-x-4">
          <a
            href="https://www.facebook.com/akki.tomar.9081"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
            className="text-gray-400 transition hover:text-white"
          >
            <FaFacebookF />
          </a>
          <a
            href="https://x.com/ASTOMAR98"
            target="_blank"
            rel="noreferrer"
            aria-label="X (Twitter)"
            className="text-gray-400 transition hover:text-white"
          >
            <FaXTwitter />
          </a>
          <a
            href="https://www.instagram.com/suk0on1"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="text-gray-400 transition hover:text-white"
          >
            <FaInstagram />
          </a>
        </div>
      </div>
    </footer>
  )
}

function LinkPlaceholder({ label }: { label: string }) {
  return (
    <a href="#" className="text-gray-400 transition hover:text-white">
      {label}
    </a>
  )
}