/**
 * Markwork - Interactive and Collaborative Feedback Platform
 * Copyright (C) 2026 Joseph Perez
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './responsive.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
