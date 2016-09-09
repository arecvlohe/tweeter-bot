'use strict'

const config = require('./config')
const debugBot = require('debug')('bot')
const debugServer = require('debug')('server')
const EventEmitter = require('events')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Twit = require('twit')

debugBot('starting bot')
const client = new Twit(config)

const stream = client.stream('statuses/filter', {
  track: ['javascript', 'nodeschool', 'teach', 'suncoast']
})

// Server
const events = new EventEmitter()
const app = express()
const server = http.createServer(app)
app.use(express.static('public'))

const io = socketio(server)

io.on('connection', socket => {
  events.on('retweet', message => {
    socket.emit('retweet', message)
  })
})

server.listen(3000, () => {
  debugServer('Server listening!')
})

// Bot
stream.on('tweet', tweet => {
  debugBot('received a tweet')
  if (tweet.text.match(/@adamrecvlohe/)) {
    client.post('statuses/retweet/:id', { id: tweet.id_str })
    events.emit('retweet', {
      by: tweet.user.screen_name,
      text: tweet.text
    })
    debugBot('retweeted %s', tweet.text)
    client.post('favorites/create', { id: tweet.id_str })
    debugBot('liked %s', tweet.text)
    return
  }
})
