<template>
	<div class="container">
		<h1 style="text-align: center;">LOGGER VIEWER</h1>
		<div class="lines-box" v-for="(value, key) in _usersLogs" :key="key">
			<h3 style="margin-bottom: 1rem;">{{key}} {{value[0].message.user.name}}</h3>
			<div class="lines-conteiner">
				<p class="lines" v-for="(elem, i) in value" :key="i">{{elem.message.fnc}} {{ elem.level === 'error' ? elem.message.error.code : ''}} {{`${elem.message.botTitle} ${elem.message.botID} ${elem.message.processId}`}} {{ elem.message.order ? elem.message.order : ''}}</p>
			</div>
		</div>
 	</div>
</template>

<script>
export default {
	layout: 'admin',
	data() {
		return {
			logs: []
		}
	},
	computed: {
		_usersLogs() {
			let _usersLogs = {};

			this.logs.forEach(elem => {
				!_usersLogs[elem.message.user.userId] && (_usersLogs[elem.message.user.userId] = []);
				_usersLogs[elem.message.user.userId].push(elem);
			});
			return _usersLogs;
		}
	},
	mounted() {
		this.getLogData();
	},
	methods: {
		getLogData() {
			this.$axios
				.$get('/api/admin/loggerViewer', {})
				.then(data => {
					if(data.status === 'ok') {
						this.logs = data.data;
						setTimeout(() => {
							this.getLogData();	
						}, 5000)
					} else {
						console.log(data);
						setTimeout(() => {
							this.getLogData()
						}, 100000);
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
	background-color: #efefef;
	padding: 5px;
}

.lines-conteiner {
	width: 100%;
	max-height: 400px;
	overflow: auto;	
}
</style>