const { createLogger, format, transports } = require('winston')
const { combine, timestamp, json, simple, prettyPrint, printf, errors, cli } = format

const consoleFormat = printf((info) => {
  if (info.stack) { info.message = `${info.timestamp} | ${info.stack}` } else { info.message = `${info.timestamp} | ${info.message}` }
})

const logger = createLogger({
  level: 'info',
  format: combine(
    json(),
    timestamp(),
    errors({ stack: true }),
    prettyPrint()
  ),
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/warn.log', level: 'warn' }),
    new transports.File({ filename: 'logs/verbose.log', level: 'info' })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    level: 'debug',
    format: combine(errors({ stack: true }), simple(), consoleFormat, cli({ all: true }))
  }))
}

function debug (msg) {
  log(msg, 'debug')
}

function info (msg) {
  log(msg, 'info')
}

function warn (msg) {
  log(new Error(msg), 'warn')
}

function error (msg) {
  log(new Error(msg), 'error')
}

function log (msg, lvl) {
  logger.log({
    level: lvl,
    message: msg
  })
}

module.exports = { debug, info, warn, error }
