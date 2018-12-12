const https = require('https')
const appId = process.env.HUBOT_GEOCODE_STORE_HERE_ID
const appCode = process.env.HUBOT_GEOCODE_STORE_HERE_CODE
const baseUrl = `https://geocoder.api.here.com/6.2/geocode.json?app_id=${appId}&app_code=${appCode}&searchtext=`
const adapterName = 'here'

module.exports = (robot, cache) => {
  // Don't bother doing much of anything if this API is disabled
  const noApiKey = !appId || !appCode
  if (noApiKey) {
    robot.logger.info('No key for Here API. Disabling...')
  }
  return query => {
    // Nodejs' native https library has a messy API, but we can abstract it with a friendly Promise
    // ...beats using Hubot's unmaintained http library: https://github.com/technoweenie/node-scoped-http-client
    return new Promise((resolve, reject) => {
      if (noApiKey || cache.isDisabled(adapterName)) {
        resolve({ status: 'disabled' })
        return
      }
      https.get(
        generateUrl(query),
        { timeout: 5e3 },
        response => {
          let responseData = ''

          // A chunk of data has been recieved.
          response.on('data', chunk => {
            responseData += chunk
          })

          // The whole response has been received. Print out the result.
          response.on('end', () => {
            // Either we got back invalid JSON or the API's response wasn't an object
            try {
              responseData = JSON.parse(responseData).Response
            } catch (error) {
              cache.reportError(adapterName)
              resolve({ status: 'error' })
            }

            let location = null
            try {
              location = responseData.View[0].Result[0].Location
            } catch (error) {
              resolve({ status: 'no results' })
              return
            }

            resolve({
              address: location.Address.Label,
              latitude: location.DisplayPosition.Latitude,
              longitude: location.DisplayPosition.Longitude,
              status: 'ok'
            })
          })
        })
        .on('error', error => {
          cache.reportError(adapterName)
          resolve({ status: 'error' })
        })
    })
  }
}

function generateUrl(query) {
  return baseUrl + query.map(word => encodeURIComponent(word)).join('+')
}
