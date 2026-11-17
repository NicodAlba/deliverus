import { fileURLToPath } from 'url'
import path from 'path'
import express from 'express'
import { sequelizeSession } from '../models/models.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const loadFileRoutes = function (app) {
  const uploads = path.resolve(process.env.UPLOAD_ROOT || '.', 'public')
  const bundled = path.join(__dirname, '../../public')
  app.use('/public', express.static(uploads))
  app.use('/public', express.static(bundled))
  for (const folder of ['avatars', 'restaurants/products', 'restaurants']) {
    app.use('/public/' + folder, express.static(path.join(bundled, 'example_assets')))
  }
  app.get('/health', async (req, res) => {
    try {
      await sequelizeSession.authenticate()
      res.json({ status: 'ok' })
    } catch {
      res.status(503).json({ status: 'unavailable' })
    }
  })
  app.get('/', (req, res, next) => {
    if (process.env.WEB_ROOT) return next()
    res.send('DeliverUS API')
  })
  if (process.env.ENABLE_LOCAL_SHUTDOWN === 'true' && process.env.NODE_ENV !== 'production') app.post('/shutdown', (req, res) => {
    console.log('Shutting down server')
    res.sendStatus(200)
    setTimeout(() => {
      process.exit(0)
    }, 1000)
  })
}

export default loadFileRoutes
