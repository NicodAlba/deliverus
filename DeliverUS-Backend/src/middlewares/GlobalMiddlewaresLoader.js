import helmet from 'helmet'
import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'

const loadGlobalMiddlewares = app => {
  const origins = (process.env.ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean)
  if (process.env.DEMO_MODE === 'true' && !origins.length) {
    throw new Error('ALLOWED_ORIGINS is required for the public demo')
  }
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY))
  app.use(cors({
    origin: (origin, done) => done(null, !origin || origins.includes(origin)),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  }))
  app.use(express.json({ limit: '100kb' }))
  app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        // Expo web uses React Native inline styles and bundled data images/fonts.
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'blob:'],
        'font-src': ["'self'", 'data:'],
        'upgrade-insecure-requests': process.env.DEMO_MODE === 'true' ? [] : null
      }
    }
  }))
  if (process.env.DEMO_MODE === 'true') {
    app.use(['/api', '/users', '/restaurants', '/products', '/orders'], rateLimit({
      windowMs: 60000, limit: 180, skip: req => req.path.startsWith('/public/') || req.path === '/health', standardHeaders: 'draft-7', legacyHeaders: false
    }))
    app.use(['/api/users/login', '/api/users/loginOwner', '/api/users/register', '/api/users/registerOwner', '/users/login', '/users/loginOwner', '/users/register', '/users/registerOwner'], rateLimit({
      windowMs: 15 * 60000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false
    }))
    // Controllers sometimes serialize Sequelize errors directly.
    app.use((req, res, next) => {
      const send = res.send
      res.send = function (body) {
        if (this.statusCode >= 500 || body?.name?.startsWith('Sequelize')) {
          this.type('application/json')
          return send.call(this, JSON.stringify({ errors: [{ msg: 'The request could not be completed.' }] }))
        }
        return send.call(this, body)
      }
      next()
    })
  }
}

export default loadGlobalMiddlewares
