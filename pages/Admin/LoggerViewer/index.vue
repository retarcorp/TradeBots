<template>
	<div class="container">
		<h1 style="text-align: center;">LOGGER VIEWER</h1>
		<div class="lines-box" v-for="(value, key) in _usersLogs" :key="key">
			<h3 style="margin-bottom: 1rem;">{{key}} {{value[0].message.user.name}}</h3>
			<div class="lines-conteiner">
				<div style="border-bottom: 1px solid black;" v-for="(elem, i) in value" :key="i">
					<p class="lines" :class="elem.level === 'error' ? 'lines-error' : ''">{{elem.time}}, {{elem.level}}</p>

					<div v-for="(el, key) in elem.message" :key="key">
						<div v-if="typeof el === 'object' && Object.keys(el).length > 1 ">
							{{key}} : 
							<br>
							<p class="line_tabs" v-for="(el_, key_) in el" :key="key_">
								{{key_}} : {{el_}}
							</p>
						</div>
						<div v-else>
							{{key}} : {{el}}
						</div>
					</div>

					<!-- <p class="lines" >{{elem.time}} : {{elem.message.fnc}} {{`${elem.message.botTitle} ${elem.message.botID} ${elem.message.processId}`}} {{ elem.message.order ? elem.message.order : ''}}</p>
					<p>{{ elem.level === 'error' ? elem.message.error.code : ''}}</p>
					<p>{{ elem.level === 'error' ? elem.message.error : ''}}</p> -->
				</div>
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
			let start = this.logs.length,
				end = start + 1000;
			this.$axios
				.$post('/api/admin/loggerViewer', {start, end})
				.then(data => {
					if(data.status === 'ok') {
						this.logs.push(...data.data);
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

.lines-error {
	background-color: #fec1c1;
}

.line_tabs {
	margin-left: 2rem; 
}

.lines-conteiner {
	width: 100%;
	max-height: 400px;
	overflow: auto;	
}
</style>