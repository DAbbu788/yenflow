import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <Navbar />
      {/* Desktop: offset for sidebar. Mobile: no offset, pad bottom for tab bar */}
      <main className="flex-1 md:ml-56 min-h-screen overflow-x-hidden pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
