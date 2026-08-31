import { Link } from 'react-router';
import { Mail, Phone, MapPin, Facebook, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1A1A2E] text-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#FFC107] rounded flex items-center justify-center">
                <span className="font-bold text-[#1A1A2E]">TS</span>
              </div>
              <span className="font-bold text-xl">Tower Structure</span>
            </div>
            <p className="text-gray-400">
              Expert en ingénierie structurelle et formation BIM
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-[#FFC107]">Navigation</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/" className="hover:text-[#FFC107] transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#FFC107] transition-colors">
                  À Propos
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-[#FFC107] transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/formations" className="hover:text-[#FFC107] transition-colors">
                  Formations
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-[#FFC107]">Contact</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                contact@tower-structure.fr
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                +33 1 23 45 67 89
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                75 Avenue de Paris, 75016
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-[#FFC107]">Suivez-nous</h3>
            <div className="flex gap-4">
              <a href="#" className="hover:text-[#FFC107] transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-[#FFC107] transition-colors">
                <Linkedin className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-[#FFC107] transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2026 Tower Structure. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
