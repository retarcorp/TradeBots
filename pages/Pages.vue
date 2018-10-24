<template>
    <div>
		{{ this.curentPage.content }}
    </div>
</template>

<script>
export default {
    computed: {
		pagesList() {
			return this.$store.getters.getPagesList;
		},
		curentPage() {
			let curPageSlug = this.$route.query.page || {};
			let curPage = this.pagesList.find(page => page.slug === curPageSlug);
			return curPage || {};
		}
    },
    created() {
    }
}
</script>

<style scoped>

</style>
