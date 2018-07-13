'use strict'

const request = require('request-promise')

/* eslint-disable standard/array-bracket-even-spacing */
const communityIds = [
  /* programming */ '9d175334-ccdd-4da8-a3aa-d9631f95610e',
  /* unity3d */ 'beed41df-c336-40a3-ae50-db9909b360f1',
  /* javascript */ '0883652a-f3e8-4fd1-8136-755a02157d21',
  /* python */ 'a4c366ad-46b6-40fb-ab58-8613b2dd3f02',
  /* ai */ '7a533c6d-961b-4be7-9b7b-6e17fd00eb3e'
]

const gameIds = [
  /* creative */ '488191',
  /* programming */ '458688',
  /* game developer */ '488469',
  /* irl */ '494717'
]

const youtubeTerms = [
  '[code]',
  'programming',
  '[development]'
]

/* eslint-disable no-param-reassign */

module.exports = function getStream (context) {
  // throw a coin, pick twitch or youtube
  if ((context.di_percentage || Math.random()) > 0.5) {
    getTwitchStream(context)
  } else {
    getYtStream(context)
  }
}

function getTwitchStream (context) {
  // allow di injected libs if provided
  // these will exist in mocked testing, but not in integration tests nor prod
  let req = context.di_request || request

  req(`https://api.twitch.tv/helix/streams?community_id=${communityIds.join(',')}`, {headers: {'Client-ID': process.env.twitchApiKey}, json: true})
    .then((body) => {
      if (!body) throw new Error(`Missing stream content`)

      return body.data
    })
    .then((data) => {
      return data.filter(e => gameIds.indexOf(e.game_id) !== -1)
    })
    .then((data) => {
      // pick a random one :smile:
      return data[Math.floor(Math.random() * data.length)]
    })
    .then((data) => {
      // mark as from twitch
      data.src = 'twitch'

      // sadly we need another api call for the username (see #2)
      return req(`https://api.twitch.tv/helix/users?id=${data.user_id}`, {headers: {'Client-ID': process.env.twitchApiKey}, json: true})
        .then((body) => {
          if (!body) throw new Error(`Missing user content`)

          const selectedUser = body.data[0].login

          // add the login info in as well
          data.login = selectedUser

          return data
        })
    })
    .then((data) => {
      // populate the response
      context.res.status = 200

      context.res.body = data

      // sadly we need to specify json ourselves (see #1)
      context.res.headers = {
        'Content-Type': 'application/json'
      }
    })
    .catch((err) => {
      context.log(err)
      context.res.status = 500
      context.res.body = err.message
    })
    .then(context.done)
}

function getYtStream (context) {
  // allow di injected libs if provided
  // these will exist in mocked testing, but not in integration tests nor prod
  let req = context.di_request || request

  let proms = []
  youtubeTerms.forEach((term) => {
    const prom = req(`https://www.googleapis.com/youtube/v3/search/?type=video&q=${term}&maxResults=20&eventType=live&part=snippet&key=${process.env.youtubeApiKey}`, {json: true})
    proms.push(prom)
  })

  Promise.all(proms)
    .then((results) => {
      return results
        .map(r => r.items).reduce((prev, next) => {
          return prev.concat(next)
        })
        .filter((elem) => {
          let includesTerm = false
          youtubeTerms.forEach((term) => {
            if (!includesTerm) {
              includesTerm = elem.snippet.title.toLowerCase().includes(term)
            }
          })

          return includesTerm
        })
    })
    .then((data) => {
      const selected = data[Math.floor(Math.random() * data.length)]
      selected.src = 'youtube'

      return selected
    })
    .then((data) => {
      // populate the response
      context.res.status = 200

      context.res.body = data

      // sadly we need to specify json ourselves (see #1)
      context.res.headers = {
        'Content-Type': 'application/json'
      }
    })
    .catch((err) => {
      context.log(err)
      context.res.status = 500
      context.res.body = err.message
    })
    .then(context.done)
}
