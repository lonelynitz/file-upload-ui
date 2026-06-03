import './App.css'
import { Suspense, lazy } from 'react'

const FileUpload = lazy(() => import('./fileUpload').then(module => ({ default: module.FileUpload })))

function App() {
  return (
    <div style={{ textAlign: 'center' }}>
      <Suspense fallback={<p>Loading file upload...</p>}>
        <FileUpload />
      </Suspense>
    </div>
  )
}

export default App
