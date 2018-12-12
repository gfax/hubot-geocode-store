const ava = require('ava')
const sinon = require('sinon')
const cacheModel = require('./cache-model')

function generateRobot() {
  // Generate a mock robot object
  return {
    brain: {
      data: {}
    }
  }
}

ava.test.serial('should initialize storage when there is none', t => {
  const robot = generateRobot()
  cacheModel(robot)
  t.is(typeof robot.brain.data.geocodeStore, 'object')
  t.is(typeof robot.brain.data.geocodeStore.adapters, 'object')
  t.is(typeof robot.brain.data.geocodeStore.cache, 'object')
  t.is(typeof robot.brain.data.geocodeStore.users, 'object')
})

ava.test.serial('should prune the storage cache on initialization', t => {
  const robot = {
    brain: {
      data: {
        geocodeStore: {}
      }
    }
  }
  const store = robot.brain.data.geocodeStore
  const longAgo = (new Date()).getTime() - (120 * 24 * 60 * 60 * 1000)
  store.cache = {
    aquery: {
      timestamp: longAgo - 1
    },
    bquery: {
      timestamp: (new Date()).getTime()
    },
    cquery: {
      timestamp: (new Date()).getTime() - (24 * 60 * 60 * 1000)
    }
  }

  cacheModel(robot)
  t.is(typeof store.cache.aquery, 'undefined')
  t.is(typeof store.cache.bquery, 'object')
  t.is(typeof store.cache.cquery, 'object')
})

ava.test.serial('should disable api adapter after 5 errors within 24 hours', t => {
  const adapter = 'fooApi'
  const cacheInstance = cacheModel(generateRobot())
  t.false(cacheInstance.isDisabled(adapter))
  cacheInstance.reportError(adapter)
  cacheInstance.reportError(adapter)
  cacheInstance.reportError(adapter)
  cacheInstance.reportError(adapter)
  t.false(cacheInstance.isDisabled(adapter))
  cacheInstance.reportError(adapter)
  t.true(cacheInstance.isDisabled(adapter))
  cacheInstance.reportError(adapter)
  t.true(cacheInstance.isDisabled(adapter))
  t.false(cacheInstance.isDisabled('anotherApi'))
})

ava.test.serial('should no longer be disabled after a 24 rest period', t => {
  const clock = sinon.useFakeTimers()
  const adapter = 'fooApi'
  const cacheInstance = cacheModel(generateRobot())
  Array.from({ length: 10 }, () => cacheInstance.reportError(adapter))
  t.true(cacheInstance.isDisabled(adapter))
  clock.tick(24 * 60 * 60 * 1000)
  t.false(cacheInstance.isDisabled(adapter))
  clock.restore()
})
