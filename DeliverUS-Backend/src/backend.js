import { initializeServer, disconnectDatabase } from './app.js'

try {
  const { server, app } = await initializeServer(true)
  const stop = () => {
    const timeout = setTimeout(() => process.exit(1), 10000)
    timeout.unref()
    server.close(async () => {
      await disconnectDatabase(app)
      process.exit(0)
    })
  }
  process.once('SIGTERM', stop)
  process.once('SIGINT', stop)
} catch {
  console.error('DeliverUS could not start. Verify MariaDB connectivity, credentials and configuration.')
  process.exitCode = 1
}
