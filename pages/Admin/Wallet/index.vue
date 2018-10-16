<template>
    <div class="container wallet">
		<div>
			<div>Адрес кошелька, на которого приходит оплата - </div>
			<div>{{_walletAddress}}</div>
		</div>
		<div>
			<div>Выдаваемые адреса для пополнения:</div>
			<div>
				<div v-for="(user, i) in _usersWalletAddress" :key="i">
					<div>{{user.name}}</div>
					<div>{{user.userId}}</div>
					<div>{{user.walletAddress}}</div>
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
				walletAddress: '',
				usersWalletAddress: []
			}
		},
        computed: {
			_walletAddress() {
				return this.walletAddress;
			},
			_usersWalletAddress() {
				return this.usersWalletAddress;
			}
        },
		created() {
			this.$axios.get('/api/admin/getWallet')
				.then(res => {
					this.walletAddress = res.data.data.walletAddress;
					this.usersWalletAddress = res.data.data.usersWalletAddress;
				})
				.catch(err => console.log(err));
		}
	}
</script>
<style>
</style>
