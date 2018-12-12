// Gets instantiated in index.js when the plugin is instantiated
module.exports = function cacheModel(robot) {

  // Initialize the storage on startup if it doesn't exist
  if (!robot.brain.data.geocodeStore) {
    robot.brain.data.geocodeStore = generateGeocodeStore()
  }
  const store = robot.brain.data.geocodeStore
  // Perform some startup maintenance on the existing storage
  pruneCache()


  return {
    cacheResult,
    getResults,
    getUserLocation,
    isDisabled,
    reportError,
    setUserLocation
  }

  function cacheResult(query, results) {
    store.cache[query.join] = {
      results,
      timestamp: (new Date()).getTime()
    }
  }

  function generateGeocodeStore() {
    return {
      // Place to keep track of errors for the individual api adapters
      adapters: {},
      // Store request results to save on network requests
      cache: {},
      // User-stored location preferences
      users: {}
    }
  }

  function getAdapterStore(adapterName) {
    if (!store.adapters[adapterName]) {
      store.adapters[adapterName] = {
        errors: []
      }
    }
    return store.adapters[adapterName]
  }

  function getResults(query) {
    return store.cache[query.join]
  }

  function getUserLocation(userId) {
    return store.users[userId]
  }

  function isDisabled(adapterName) {
    const errors = getAdapterStore(adapterName).errors
    if (errors.length < 5) {
      return false
    }
    return errors.reduce((acc, error) => acc && isFreshError(error), true)
  }

  // Errors older than 24 hours can be ignored
  function isFreshError(error) {
    const dayAgo = new Date().getTime() - (24 * 60 * 60 * 1000)
    return error.timestamp > dayAgo
  }

  // Prune cache items older than 120 days
  function pruneCache() {
    const longAgo = new Date().getTime() - (120 * 24 * 60 * 60 * 1000)
    for (const key in store.cache) {
      if (store.cache[key].timestamp < longAgo) {
        delete store.cache[key]
      }
    }
  }

  // Log errors. If there are enough errors within a day then the adapter will be disabled
  function reportError(adapterName) {
    getAdapterStore(adapterName).errors.push({ timestamp: (new Date()).getTime() })
    if (getAdapterStore(adapterName).errors.length > 5) {
      getAdapterStore(adapterName).errors = getAdapterStore(adapterName).errors.slice(1)
    }
  }

  function setUserLocation(userId, location) {
    store.users[userId] = {
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude
    }
  }

}
