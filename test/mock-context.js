const debug = require('debug')('coding.watch')

/**
 * Creates a mock context that can be configured to validate expectations upon completion
 * @param {*} doneCb callback to be called when the context has been marked as done()
 * @description note: expectations must be configured before use
 */
module.exports = function createContext (doneCb) {
  const mck = {
    log: debug.bind(debug),
    res: {},
    done: () => {
      // default status to 200
      if (!mck.res.status) {
        mck.res.status = 200
      }

      mck.__expects.forEach(e => e(mck))
      doneCb()
    },
    __expects: [],
    expect: (fn) => {
      mck.__expects.push(fn)

      return mck
    }
  }

  return mck
}
