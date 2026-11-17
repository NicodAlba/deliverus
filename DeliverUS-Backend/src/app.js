import express from 'express'
import dotenv from 'dotenv'
import loadRoutes from './routes/index.js'
import { initPassport } from './config/passport.js'
import { initSequelize, disconnectSequelize } from './config/sequelize.js'
import loadGlobalMiddlewares from './middlewares/GlobalMiddlewaresLoader.js'
import loadWebApps from './webApps.js'

const initializeApp = async () => {
  dotenv.config()
  const app = express()
  loadGlobalMiddlewares(app)
  const api = express.Router()
  await loadRoutes(api)
  app.use('/api', api)
  app.use(api)
  initPassport()
  app.connection = await initializeDatabase()
  loadWebApps(app)
  app.use((error, req, res, next) => {
    res.status(error.status === 413 ? 413 : 400).json({ errors: [{ msg: 'Invalid request.' }] })
  })
  return app
}

const initializeServer = async (enableConsoleLog = false) => {
  controlConsoleLog(enableConsoleLog)
  try {
    const app = await initializeApp()
    const port = process.env.PORT || process.env.APP_PORT || 3000
    const server = await new Promise((resolve, reject) => {
      const listener = app.listen(port, process.env.HOST || '0.0.0.0', () => resolve(listener))
      listener.on('error', reject)
    })
    console.log('DeliverUS listening at http://localhost:' + server.address().port)
    return { server, app }
  } catch (error) {
    throw new Error('DeliverUS startup failed. Check database connectivity and server configuration.', { cause: error })
  }
}

const initializeDatabase = async () => {
  return initSequelize()
}

const disconnectDatabase = async (app) => {
  try {
    await disconnectSequelize(app.connection)
    console.log('INFO - Relational/MariaDB/Sequelize technology disconnect.')
  } catch (error) {
    console.error(error)
  } finally {
    controlConsoleLog(true)
  }
}

const controlConsoleLog = (enable) => {
  if (!enable) {
    global.originalConsoleLog = console.log
    console.log = () => {}
  } else {
    console.log = global.originalConsoleLog || console.log
  }
}

export { initializeApp, disconnectDatabase, initializeServer }
