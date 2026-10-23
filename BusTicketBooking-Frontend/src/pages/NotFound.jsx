import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="section py-5">
      <div className="container text-center">
        <h1 className="display-6 mb-2">404</h1>
        <p className="text-muted mb-4">This page does not exist.</p>
        <Link to="/" className="btn btb-btn-brand">
          Back to home
        </Link>
      </div>
    </div>
  )
}
