import 'dotenv/config'
import { spawn } from 'node:child_process'
import { sequelizeSession, User } from '../src/models/models.js'

function cli (...args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/sequelize-cli/lib/sequelize', ...args], {
      stdio: 'inherit', env: process.env
    })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve() : reject(new Error('Database preparation failed')))
  })
}

try {
  await sequelizeSession.authenticate()
  // A single volume-backed replica runs this process. Seed metadata records each completed seeder.
  await cli('db:migrate')
  if (process.env.SEED_DEMO === 'true') {
    if (process.env.DEMO_MODE !== 'true') throw new Error('SEED_DEMO requires DEMO_MODE')
    const tables = await sequelizeSession.getQueryInterface().showAllTables()
    const userCount = await User.count()
    if (userCount > 0 && !tables.some(table => (table.tableName || table) === 'SequelizeData')) {
      throw new Error('Refusing to seed a populated database without seed metadata')
    }
    await cli('db:seed:all')
  }
  const child = spawn(process.execPath, ['src/backend.js'], { stdio: 'inherit', env: process.env })
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => child.kill(signal))
  child.on('exit', code => { process.exitCode = code || 0 })
  await sequelizeSession.close()
} catch {
  console.error('Production initialization failed. Check MariaDB, migrations and seed metadata.')
  await sequelizeSession.close().catch(() => {})
  process.exitCode = 1
}
