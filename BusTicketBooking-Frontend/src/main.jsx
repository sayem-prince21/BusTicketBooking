import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// Bootstrap is imported exactly once, here.
import 'bootstrap/dist/css/bootstrap.min.css'

// Custom stylesheets (kept in separate, organized files).
import './styles/global.css'
import './styles/navbar.css'
import './styles/footer.css'
import './styles/home.css'
import './styles/bus-search.css'
import './styles/seat-selection.css'
import './styles/booking.css'
import './styles/auth.css'
import './styles/dashboard.css'
import './styles/admin.css'
import './styles/print.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
