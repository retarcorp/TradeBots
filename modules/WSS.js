const WebSocket = require('ws')
// const server = require('../index');

// const server = app.server;


module.exports = {
	init(server) {
		this.socket = new WebSocket.Server({server})
		this.users = {}
		this.userID = 0
		this.setListneres()
	}

	,setListneres() {
		this.socket.on('connection', (ws) => {
			ws.userID = this.userID++
			ws.send(ws.userID)
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
		
		})
	}
}

// wss.clients[0].send('asd');