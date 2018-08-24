const WebSocket = require('ws')
// const server = require('../index');

// const server = app.server;


module.exports = {
	init(server) {
		this.socket = new WebSocket.Server({server})
		this.users = {}
		this.setListneres()
	}

	,setListneres() {
		this.socket.on('connection', (ws) => {
			let id = Math.random()
			ws.userID = id
			ws.send(ws.userID)
			console.log('соединение открыто ' + id)
			this.users[ws.userID] = ws
			ws.on('message', (mess) => {
				ws.send(mess)
				// this.current = ws || {}
				// this.current.send(mess)

				// this.socket.clients.forEach(client => {
				// 	console.log(client.ID)
				// 	client.send(mess)
				// })
			})
			
			ws.on('close', function() {
				console.log('соединение закрыто ' + id)
				// clients[ws.userID]
			})
		})

		
	}
}

// wss.clients[0].send('asd');