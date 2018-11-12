<template>
	<div class="container">
		<h1 style="text-align: center;">LOGGER VIEWER</h1>
		<div class="lines-box" v-for="(value, key) in _logs" :key="key">
			<h3>{{key}}</h3>
			<div class="lines-conteiner">
				<p class="lines" v-for((elem, i) in value) :key="i">{{elem}}</p>
			</div>
		</div>
 	</div>
</template>

<script>
export default {
	layout: 'admin',
	data() {
		return {
			lastLineIndex: 0,
			logs: []
		}
	},
	computed() {
		_logs: {
			let botsLogs = {};

			this.logs.forEach(elem => {
				elem = JSON.parse(elem);
				let btId = elem.botID;
				!botsLogs[btId] && (botsLogs[btId] = []);

				botsLogs[btId].push(elem);
			});

			return botsLogs;
		}
	},
	mounted() {
		this.getLogData();
	},
	methods: {
		getLogData() {
			this.$axios
				.$post('/api/admin/loggerViewer', {})
				.then(data => {
					data = data.data;
					if(data.status === 'ok') {
						this.logs.push(data.data);
						this.lastLineIndex++;
						setTimeout(() => {
							this.getLogData();	
						}, 200)
					} else {
						console.log(data);
						setTimeout(() => {
							this.getLogData()
						}, 10000);
					}
				})
				.catch(error => {
					console.log(error);
				}) 
		}
	}
}
</script>

<style lang="scss" scoped>
.lines-box {
	border: 1px solid #aaa;
	padding: 2rem;
	margin: 1rem;
}

.lines {
	background-color: #eee;
}

.lines-conteiner {
	width: 100%;
	max-height: 400px;
	overflow: auto;	
}
</style>