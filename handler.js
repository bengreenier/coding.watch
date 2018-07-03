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
      if (!body) throw new Error(`Missing stream content`)

      const selectedStream = body.data[Math.floor(Math.random() * body.data.length)]

      context.log(`selected ${selectedStream.id} ${selectedStream.title} (${selectedStream.viewer_count})`)

      // sadly we need another api call for the username (see #2)
      return req(`https://api.twitch.tv/helix/users?id=${selectedStream.user_id}`, {headers: {'Client-ID': process.env.twitchApiKey}, json: true})
        .then((userBody) => {
          if (!userBody) throw new Error(`Missing user content`)

          const selectedUser = userBody.data[0].login

          context.log(`selected ${selectedStream.user_id} is ${selectedUser})`)

          // add the login info in as well
          selectedStream.login = selectedUser
        })
        .then(() => {
          // populate the response
          context.res.status = 200

          // sadly, we need to json stringify this to avoid some azure runtime issues (see #1)
          context.res.body = JSON.stringify(selectedStream)

          // sadly we need to specify json ourselves (see #1)
          context.res.headers = {
            'Content-Type': 'application/json'
          }
        })
    }).catch((err) => {
      context.log(err)
      context.res.status = 500
      context.res.body = err.message
    })
    .then(context.done)
}
