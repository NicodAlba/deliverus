const config = require('./app.json')

module.exports = () => {
  const expo = { ...config.expo }
  // Local Metro remains at /. The production export uses the app-specific prefix.
  if (process.env.WEB_BASE_PATH) {
    expo.experiments = { ...expo.experiments, baseUrl: process.env.WEB_BASE_PATH }
  } else {
    expo.experiments = { ...expo.experiments, baseUrl: '' }
  }
  return expo
}
