- [Overview](#overview)
- [Commands](#commands)
- [Installation](#installation)
- [Usage in other plugins](#usage-in-other-plugins)
- [Development and testing](#development-and-testing)

## Overview

A highly robust Hubot script for looking up and storing users' geolocation (latitude/longitude) given a physical address or IP address.

This uses one or more services for geolocation to provide flexibility and redundancy.

The coordinates are stored for the user and can be leveraged by other plugins so the user doesn't have to provide their location to every Hubot plugin every time they want to lookup up something like the weather, traffic, or sun phase for their location.

## Commands

Store a location:

```
<bot name> set [my] location Richmond, VA
```

Look up an IP address geolocation:

```
<bot name> locate 1.1.1.1
```

Look up an address the sameway

```
<bot name> locate Richmond, VA
```

These commands can also be accessed from the bot by typing `<bot name> help geocode`

## Installation

Generate an API key for one or more of the supported services (the more services the more redundancy).
Then set the environment variables required for each API adapter:

- [here.com](https://developer.here.com) - Provide the project id and code as `HUBOT_GEOCODE_STORE_HERE_ID` and `HUBOT_GEOCODE_STORE_HERE_CODE` respectively.
- [geocod.io](https://www.geocod.io/) - Provide the API key as `HUBOT_GEOCODE_STORE_GEOCODIO_KEY`
- [ip-api.com](http://ip-api.com/) - No API key needed for basic usage.

```bash
# Install via Yarn - https://yarnpkg.com/lang/en/
yarn add hubot-geocode-store
# Install via npm
npm install --save hubot-geocode-store
```

## Usage in other plugins

This plugin exposes some public methods on the `robot` object that are accessible from other plugins:

### `robot.globalMethods.fetchGeolocation`

Takes an array of strings, each string being a word that makes up a query address such as a physical address or ip address. Examples:
```js
['400', 'Broad', 'St.', 'NY']
```
```js
['4.2.2.2']
```
Returns an object:
```
{
  address: '4.2.2.2',
  latitude: 37.2262,
  longitude: -95.7341
}
```

### `robot.globalMethods.getUserLocation`

Takes a user id (`msg.message.user.id`) and returns a location object (see above example).

## Development and testing

Start hubot from the command line and it will load up the plugin to run tests on:

```bash
yarn start
```

You can also run unit tests and lint the code:

```bash
yarn test
```
