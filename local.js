const handler = require('serve-handler')
const http = require('http')
const fs = require('fs')
const replaceStream = require('replacestream')
const fn = require('./handler')

// this is required for the api
if (!process.env.twitchApiKey) {
  console.warn('missing environment variable: twitchApiKey')
}

// we'll populate this when we start the server
let localPort

// start a server that redirects /api/getStream calls to the handler
const server = http.createServer((request, response) => {
  if (request.url.startsWith('/api/getStream')) {
    const mockContext = {
      req: request,
      log: console.log.bind(console),
      res: {},
      done: (err) => {
        if (err) {
          response.statusCode = 500
          response.end(err)
        } else {
          response.statusCode = mockContext.res.status
          for (let header in mockContext.res.headers) {
            response.setHeader(header, mockContext.res.headers[header])
          }
          response.end(mockContext.res.body)
        }
      }
    }

    return fn(mockContext)
  } else {
    // otherwise pass through to docs
    return handler(request, response, {
      public: './docs'
    }, {
      createReadStream (path) {
        // replace the api url to the local one
        return fs.createReadStream(path).pipe(replaceStream('https://api.coding.watch/api/getStream', `http://localhost:${localPort}/api/getStream`))
      }
    })
  }
})

// start the server
const httpSrv = server.listen(process.env.PORT || 3000, () => {
  // populate localPort!
  localPort = httpSrv.address().port
  console.log(`Running at http://localhost:${localPort}`)
})
