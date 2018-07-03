const assert = require('assert')
const createContext = require('./mock-context')
const getStream = require('../handler')

/* eslint-env node,mocha */

describe('getStream', () => {
  it('should try to lookup streams', (done) => {
    // define the expected body
    const expectedBody = {
      data: [
        {id: '0', title: 'mock stream', viewer_count: 0}
      ]
    }

    // create a mock with some assertions
    const mock = createContext(done)
      .expect((mock) => {
        assert.equal(mock.res.status, 200)
        assert.deepEqual(mock.res.body, JSON.stringify(expectedBody.data[0]))
      })

    // we also define our own request library implementation
    mock.di_request = (uri, opts) => {
      return new Promise((resolve, reject) => {
        resolve(expectedBody)
      })
    }

    // invoke
    getStream(mock)
  })

  it('should fail if twitch fails', (done) => {
    // create a mock with some assertions
    const mock = createContext(done)
      .expect((mock) => {
        assert.equal(mock.res.status, 500)
        assert.equal(mock.res.body, 'mock failure')
      })

    // we also define our own request library implementation
    mock.di_request = (uri, opts) => {
      return new Promise((resolve, reject) => {
        reject(new Error('mock failure'))
      })
    }

    // invoke
    getStream(mock)
  })

  if (!process.env.twitchApiKey) {
    console.warn('No twitchApiKey, skipping integration tests')
  } else {
    describe('integration', () => {
      it('should hit twitch', (done) => {
        // create a mock with some assertions
        const mock = createContext(done)
          .expect((mock) => {
            assert.equal(mock.res.status, 200)
            assert.ok(mock.res.body.length > 0)
          })

        // invoke
        getStream(mock)
      })
    })
  }
})
