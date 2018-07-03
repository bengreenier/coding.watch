'use strict'

const request = require('request-promise')

/* eslint-disable standard/array-bracket-even-spacing */
const communityIds = [ /* programming */ '9d175334-ccdd-4da8-a3aa-d9631f95610e' ]

/* eslint-disable no-param-reassign */

module.exports = function getStream (context) {
  // allow di injected libs if provided
  // these will exist in mocked testing, but not in integration tests nor prod
  let req = context.di_request || request

  req(`https://api.twitch.tv/helix/streams?community_id=${communityIds.join(',')}`, {headers: {'Client-ID': process.env.twitchApiKey}, json: true})
    .then((body) => {
      if (!body) throw new Error(`Missing content`)

      const selectedStream = body.data[Math.floor(Math.random() * body.data.length)]

      context.log(`selected ${selectedStream.id} ${selectedStream.title} (${selectedStream.viewer_count})`)

      context.res.status = 200
      context.res.body = JSON.stringify(selectedStream)
    }).catch((err) => {
      context.log(err)
      context.res.status = 500
      context.res.body = err.message
    })
    .then(context.done)
}
