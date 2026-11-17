import 'dotenv/config'

if (process.env.NODE_ENV === 'production') {
  console.error('Reset is disabled in production. Use npm run db:migrate for pending migrations.')
  process.exit(1)
}
