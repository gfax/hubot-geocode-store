const http = require('http')
const baseUrl = 'http://ip-api.com/json/'
const adapterName = 'ip-api'

module.exports = (robot, cache) => {
  return query => {
    return new Promise((resolve, reject) => {
      http.get(
        baseUrl + query[0],
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
              responseData = JSON.parse(responseData)
            } catch (error) {
              cache.reportError(adapterName)
              resolve({ status: 'error' })
            }

            if (responseData && responseData.lat && responseData.lon) {
              resolve({
                address: responseData.query,
                latitude: responseData.lat,
                longitude: responseData.lon,
                status: 'ok'
              })
            } else {
              resolve({ status: 'no results' })
            }
          })
        })
        .on('error', error => {
          cache.reportError(adapterName)
          resolve({ status: 'error' })
        })
    })
  }
}
