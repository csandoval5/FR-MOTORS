import { Bike } from 'lucide-react'

/**
 * Footer simple del sistema FR MOTORS
 */
export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-100 rounded-lg flex items-center justify-center">
              <Bike className="w-3.5 h-3.5 text-primary-600" />
            </div>
            <span className="text-xs font-semibold text-gray-500">
              FR MOTORS
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Términos y Condiciones
            </a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Privacidad
            </a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Soporte
            </a>
          </div>

          {/* Copyright */}
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} El Coca, Ecuador
          </p>
        </div>
      </div>
    </footer>
  )
}

