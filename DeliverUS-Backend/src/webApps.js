import express from 'express'
import path from 'node:path'

export default function loadWebApps (app) {
  if (!process.env.WEB_ROOT) return
  for (const name of ['customer', 'owner']) {
    app.use('/' + name, express.static(path.resolve(process.env.WEB_ROOT, name)))
  }
  // Navigation state stays inside React Navigation. Unknown assets must return 404.
  app.get('/', (req, res) => res.redirect('/customer/'))
}
