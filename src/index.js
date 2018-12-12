// Description:
//   Look up or store a user's geolocation based off an physical or ip address.
//
// Commands:
//   hubot locate <address> - look up address and geocode based off the given physical address and ip address
//   locate me - print your stored location, set [my] location - let the bost store a preferred location for you
//
// Author:
//   gfax

// const ipAddressApis = []
module.exports = robot => {
  // Instantiate cache from cache model
  const cache = require('./cache-model')(robot)
  // Initialize adapters
  const ipAddressAdapters = [
    require('./adapters/ip-api')(robot, cache)
  ]
  const physicalAddressAdapters = [
    require('./adapters/here')(robot, cache),
    require('./adapters/geocodio')(robot, cache)
  ]
  // Initialize global methods
  robot.globalMethods = robot.globalMethods || {}
  robot.globalMethods.fetchGeolocation = fetch

  robot.respond(/get (?:my )?location/i, msg => {
    const results = cache.getUserLocation(msg.message.user.id)
    if (results) {
      msg.reply(`Location set to ${results.address} (${results.latitude}, ${results.longitude})`)
    } else {
      msg.reply('No preferred location currently set.')
    }
  })

  robot.respond(/set (?:my )?location\s(.+)/i, msg => {
    const query = msg.match[1].split(' ')
    if (!query.length) {
      return
    }
    fetch(query)
      .then(results => {
        cache.cacheResult(query, results)
        cache.setUserLocation(msg.message.user.id, results)
        msg.reply(`Location set to ${results.address} (${results.latitude}, ${results.longitude})`)
      })
      .catch(error => {
        msg.reply('No results found.')
        robot.logger.debug(error.message)
      })
  })

  // Everything after "locate" command is captured in a group
  robot.respond(/locate\s(.+)/i, msg => {
    const query = msg.match[1].split(' ')
    fetch(query)
      .then(results => {
        cache.cacheResult(query, results)
        msg.reply(`${results.address} - (${results.latitude}, ${results.longitude})`)
      })
      .catch(error => {
        msg.reply('No results found.')
        robot.logger.debug(error.message)
      })
  })

  async function fetch(query) {
    const ipv4regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4}$/
    if (cache.getResults(query)) {
      return cache.getResults(query)
    }
    let adaptersToTry = physicalAddressAdapters
    if (query[0].match(ipv4regex)) {
      adaptersToTry = ipAddressAdapters
    }
    let results = {}
    for (const api of adaptersToTry) {
      results = await api(query)
      if (results.status === 'ok') {
        break
      }
    }
    if (results.status === 'ok') {
      return results
    }
    throw new Error(`Unable to fetch any results for "${query.join('')}".`)
  }

}
