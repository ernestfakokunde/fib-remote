import React from 'react' 
import { FaFacebookF, FaLinkedinIn, FaInstagram, FaYoutube } from 'react-icons/fa'
import SpectraLogo from '../assets/spectra.png';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: 'var(--card)', color: 'var(--text)' }} className="mt-12 border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--surface)] p-2 shadow-lg ring-1 ring-white/10">
              <img src={SpectraLogo} alt="Spectra" className="h-12 w-12 object-contain" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-wide">Spectra</p>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Inventory Hub</p>
            </div>
          </div>

          <button className="hidden md:inline-flex items-center gap-2 px-4 py-2 border rounded-full" style={{ borderColor: 'var(--border)'}}>
            <span className="text-sm">United States | English</span>
          </button>
        </div>

        <hr style={{ borderColor: 'var(--border)'}} className="border-t my-8" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <h4 className="font-bold mb-4">ABOUT US</h4>
            <ul className="space-y-3 text-sm" style={{ color: 'var(--muted)'}}>
              <li>Media Center</li>
              <li>The Spectra Foundation</li>
              <li>Investors</li>
              <li>Policies and Practices</li>
              <li>Careers</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">NEED HELP?</h4>
            <ul className="space-y-3 text-sm" style={{ color: 'var(--muted)'}}>
              <li>FAQ</li>
              <li>Contact Us</li>
              <li>International</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">LEGAL & PRIVACY</h4>
            <ul className="space-y-3 text-sm" style={{ color: 'var(--muted)'}}>
              <li>Privacy Policy</li>
              <li>Cookies Policy</li>
              <li>Cookies Settings</li>
              <li>Notice at Collection</li>
              <li>Do Not Sell or Share My Personal Information</li>
              <li>Terms of Service</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 mt-8">
          <a className="p-2 rounded-full border" style={{ borderColor: 'var(--border)'}}><FaFacebookF /></a>
          <a className="p-2 rounded-full border" style={{ borderColor: 'var(--border)'}}><FaLinkedinIn /></a>
          <a className="p-2 rounded-full border" style={{ borderColor: 'var(--border)'}}><FaInstagram /></a>
          <a className="p-2 rounded-full border" style={{ borderColor: 'var(--border)'}}><FaYoutube /></a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
