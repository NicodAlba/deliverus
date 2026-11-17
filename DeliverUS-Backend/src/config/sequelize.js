import Sequelize from 'sequelize'
import getEnvironmentConfig from './config.js'

const initSequelize = async () => {
  const config = getEnvironmentConfig()
  const connection = new Sequelize(config.database, config.username, config.password, config)
  try {
    await connection.authenticate()
    return connection
  } catch (error) {
    await connection.close()
    throw error
  }
}

const disconnectSequelize = connection => connection.close()

export { initSequelize, disconnectSequelize }
