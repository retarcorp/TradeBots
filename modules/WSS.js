const WebSocket = require('ws')
// const server = require('../index');

// const server = app.server;


module.exports = {
	init(server) {
		this.socket = new WebSocket.Server({server})

		this.setListneres()
	}

	,setListneres() {
		this.socket.on('connection', (ws) => {

			ws.on('message', (mess) => {
				this.socket.clients.forEach(client => {
					client.send(mess)
				})
			})
		
		})
	}
}

// wss.clients[0].send('asd');