<template>
    <div id="wrapper_id" class="wrapper" v-html="currentPage.content">
    </div>
</template>

<script>
export default {
	data() {
		return {
			curPage: {}
		}
	},
	computed: {
	pagesList() {
		return this.$store.getters.getPagesList;
	},
	currentPage() {
		let curPageSlug = this.$route.query.page || {};
		let curPage = this.pagesList.find(page => page.slug === curPageSlug);
		let doc = document.getElementById('wrapper_id');
		// doc.innerHTML = curPage.content;
		return curPage || {};
	}
	},
	created() {
	}
}
</script>

<style scoped>
.wrapper {
	width: 100%;
	height: 100%;
	padding: 5rem 20% 5rem 20%;
}

</style>
