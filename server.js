const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static('public'))

// при входе в комнату
io.on('connection', (socket) => {
  console.log(`Подключился: ${socket.id}`)

  socket.on('chat:join', ({ username, room }) => {
    username = String(username || '')
      .trim()
      .slice(0, 24)
    room = String(room || '')
      .trim()
      .toLowerCase()
      .slice(0, 32)

    if (!username || !room) return

    socket.join(room)
    socket.data.username = username
    socket.data.room = room

    socket.emit('chat:system', `Вы вошли в комнату «${room}»`)
    socket.to(room).emit('chat:system', `${username} подключился`)
    io.to(room).emit(
      'chat:users',
      io.sockets.adapter.rooms.get(room)?.size || 0,
    )
  })

  socket.on('chat:message', (text) => {
    const room = socket.data.room
    const username = socket.data.username
    text = String(text || '')
      .trim()
      .slice(0, 500)

    if (!room || !username || !text) return

    io.to(room).emit('chat:message', {
      username,
      text,
      time: new Date().toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    })
  })
  // при потере соединения

  socket.on('disconnect', () => {
    const { username, room } = socket.data

    if (username && room) {
      socket.to(room).emit('chat:system', `${username} отключился`)
      io.to(room).emit(
        'chat:users',
        io.sockets.adapter.rooms.get(room)?.size || 0,
      )
    }

    console.log(`Отключился: ${socket.id}`)
  })
})

server.listen(3000, () => {
  console.log('Чат запущен: http://localhost:3000')
})
