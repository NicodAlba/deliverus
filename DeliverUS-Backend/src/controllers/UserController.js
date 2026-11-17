import { User, Restaurant } from '../models/models.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import moment from 'moment'

const indexWithRestaurants = async (req, res) => {
  try {
    const users = await User.findAll({ include: Restaurant })
    res.json(users)
  } catch (err) {
    res.status(500).send(err)
  }
}

const registerCustomer = async (req, res) => {
  await _register(req, res, 'customer')
}

const registerOwner = async (req, res) => {
  await _register(req, res, 'owner')
}

const findByToken = async (token) => {
  const foundUser = await User.findOne({ where: { token }, attributes: { exclude: ['password'] } })
  if (!foundUser) {
    throw new Error('Token not valid')
  }
  if (foundUser.tokenExpiration < new Date()) {
    throw new Error('Token expired.')
  }
  return foundUser
}

const isTokenValid = async (req, res) => {
  try {
    const user = await findByToken(req.body.token)
    res.json(user)
  } catch (err) {
    return res.status(403).send({ errors: err.message })
  }
}

const loginOwner = (req, res) => {
  _login(req, res, 'owner')
}

const loginCustomer = (req, res) => {
  _login(req, res, 'customer')
}

const show = async (req, res) => {
  // Only returns PUBLIC information of users
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: ['id', 'firstName', 'email', 'avatar', 'userType']
    })
    res.json(user)
  } catch (err) {
    res.status(500).send(err)
  }
}

const update = async (req, res) => {
  try {
    if (process.env.DEMO_MODE === 'true' && ['customer1@customer.com', 'owner1@owner.com'].includes(req.user.email)) {
      return res.status(403).json({ errors: [{ msg: 'The shared demo profile is read-only. Register your own test account.' }] })
    }
    await User.update(req.body, {
      where: { id: req.user.id },
      fields: ['firstName', 'lastName', 'phone', 'address', 'postalCode', 'avatar']
    })
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } })// update method does not return updated row(s)
    res.json(user)
  } catch (err) {
    res.status(500).send(err)
  }
}

const destroy = async (req, res) => {
  try {
    if (process.env.DEMO_MODE === 'true' && ['customer1@customer.com', 'owner1@owner.com'].includes(req.user.email)) {
      return res.status(403).json({ errors: [{ msg: 'The shared demo account cannot be deleted.' }] })
    }
    const result = await User.destroy({ where: { id: req.user.id } })
    let message = ''
    if (result === 1) {
      message = 'Sucessfuly deleted.'
    } else {
      message = 'Could not delete user.'
    }
    res.json(message)
  } catch (err) {
    res.status(500).send(err)
  }
}

const _register = async (req, res, userType) => {
  try {
    req.body.userType = userType
    const newUser = new User(req.body, { fields: ['firstName', 'lastName', 'email', 'password', 'phone', 'address', 'postalCode', 'avatar', 'userType'] })
    const registeredUser = await newUser.save()
    const updatedUser = await _updateToken(registeredUser.id, _createUserTokenDTO())
    res.json(updatedUser)
  } catch (err) {
    if (err.name.includes('ValidationError') || err.name.includes('SequelizeUniqueConstraintError')) {
      res.status(422).send(err)
    } else {
      res.status(500).send(err)
    }
  }
}

const _login = async function (req, res, userType) {
  try {
    const user = await User.findOne({ where: { email: req.body.email, userType } })
    if (!user) {
      res.status(401).send({ errors: [{ param: 'login', msg: 'Wrong credentials' }] })
    } else {
      const passwordValid = await bcrypt.compare(req.body.password, user.password)
      if (!passwordValid) {
        res.status(401).send({ errors: [{ param: 'login', msg: 'Wrong credentials' }] })
      } else {
        const updatedUser = await _updateToken(user.id, _createUserTokenDTO())
        res.json(updatedUser)
      }
    }
  } catch (err) {
    res.status(401).send(err)
  }
}

const _updateToken = async (id, tokenDTO) => {
  const entity = await User.findByPk(id, {
    attributes: { exclude: ['password'] }
  })
  if (process.env.DEMO_MODE === 'true' &&
      ['customer1@customer.com', 'owner1@owner.com'].includes(entity.email) &&
      entity.token && entity.tokenExpiration > new Date()) return entity
  entity.set(tokenDTO)
  return entity.save()
}

const _createUserTokenDTO = () => {
  return {
    token: crypto.randomBytes(20).toString('hex'),
    tokenExpiration: moment().add(1, 'hour').toDate()
  }
}

const UserController = {
  indexWithRestaurants,
  registerCustomer,
  registerOwner,
  findByToken,
  isTokenValid,
  loginOwner,
  loginCustomer,
  show,
  update,
  destroy
}

export default UserController
