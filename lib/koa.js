'use strict'
module.exports = koa

var explain = require('./explain')

function koa (opts, protect) {
  var clientRetrySecs = opts.clientRetrySecs
  var sendRetryHeader = clientRetrySecs > 0
  var logging = opts.logging
  var loggingOn = typeof logging === 'string' || typeof logging === 'function'
  var log4jLogging = typeof logging === 'string'
  var errorPropagationMode = opts.errorPropagationMode
  var production = opts.production
  var expose = !production

  return overloadProtection

  function overloadProtection (ctx, next) {
    if (protect.overload === true) {
      if (sendRetryHeader) ctx.set('Retry-After', clientRetrySecs)
      if (loggingOn) {
        if (log4jLogging) ctx.log && ctx.log[logging] && ctx.log[logging](explain(protect))
        else logging(explain(protect))
      }
      if (errorPropagationMode) {
        var err = Error(explain(protect))
        err.status = 503
        err.expose = expose

        // if exposing to client in dev,
        // we also want to output
        // the error in console
        if (err.expose) {
          ctx.app.emit('error', Error(explain(protect)), ctx)
        }

        throw err
      }
      ctx.status = 503

      ctx.res.end(production ? 'Service Unavailable' : explain(protect))
      return
    }
    return next()
  }
}
