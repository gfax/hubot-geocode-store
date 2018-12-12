const https = require('https')
const apiKey = process.env.HUBOT_GEOCODE_STORE_GEOCODIO_KEY
const baseUrl = `https://api.geocod.io/v1.3/geocode?q=`
const adapterName = 'geocodio'

module.exports = (robot, cache) => {
  // Don't bother doing much of anything if this API is disabled
  if (!apiKey) {
    robot.logger.info('No key for Geocodio API. Disabling...')
  }
  return query => {
    // Nodejs' native https library has a messy API, but we can abstract it with a friendly Promise
    // ...beats using Hubot's unmaintained http library: https://github.com/technoweenie/node-scoped-http-client
    return new Promise((resolve, reject) => {
      if (!apiKey || cache.isDisabled(adapterName)) {
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
            let responseObject = null
            // Either we got back invalid JSON or the API's response wasn't an object
            try {
              console.log(responseData)
              responseData = JSON.parse(responseData).results[0]
              responseObject = {
                address: responseData.formatted_address,
                latitude: responseData.location.lat,
                longitude: responseData.location.lng,
                status: 'ok'
              }
            } catch (error) {
              cache.reportError(adapterName)
              resolve({ status: 'error' })
              return
            }

            resolve(responseObject)
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
  return baseUrl + query.map(word => encodeURIComponent(word)).join('+') + `&api_key=${apiKey}`
}
