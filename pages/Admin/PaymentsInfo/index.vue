<template>
	<div class="container">
		<div class="lines-box" v-for="(payment, i) in payments" :key="i">
			<h4>{{payment.user}}</h4>
			<p>{{payment.payment}}</p>
		</div>
 	</div>
</template>

<script>
export default {
	layout: 'admin',
	data() {
		return {
			payments: []
		}
	},
	computed: {
	},
	mounted() {
		this.getPaymentsData();
	},
	methods: {
		getPaymentsData() {
			this.$axios
				.$get('/api/admin/getPaymentsData')
				.then(data => {
					if(data.status === 'ok') {
						this.payments = data.data;
					} else {
						console.log(data);
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
	max-height: 500px;
	overflow: auto;	
}
</style>