<template>
    <div class="container">
        <div class="row">
            <div class="col-12">
                <label>Путь</label>
                <input class="input" v-model="page.slug">
                <input class="input" v-model="page.title">
                <input class="input" v-model="page.content">
                
                <!-- <vue-ckeditor v-model="page.content" :config="config" /> -->
                <button :class="{'button--disabled': !isValid}" :disabled="isValid" @click="onCreatePage">Create</button>
            </div>
            <div class="col-12">
                <div v-for="page in pages" :key='page.id'>{{ page }}</div>
            </div>
        </div>
    </div>
</template>

<script>
import VueCkeditor from 'vue-ckeditor2';
export default {
    components: { VueCkeditor },
    layout: 'admin',
    head: {
        script: [
            {
                src: "https://cdn.ckeditor.com/ckeditor5/11.1.1/classic/ckeditor.js",
                src: "https://unpkg.com/vue-ckeditor2"
            }
        ]
    },
    data() {
        return {
            pages: [],
            page: {
                slug: '',
                title: '',
                content: ''
            },
            config: {
                toolbar: [
                    ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript']
                ],
                height: 300
            }
        }
    },
    computed: {
        isValid() {
            return this.page.content && this.page.title && this.page.slug
        }
    },
    methods: {
        onCreatePage() {
            this.$axios.post('/api/admin/pages/create', this.page)
                .then(res => {
                    this.$store.commit('setMessage', res.data.message)
                    this.$store.commit('setStatus', res.data.status)
                })
                .catch(e => console.info(e))
        },
        getAllPages() {
            this.$axios.$get('/api/admin/pages/getPages')
                .then(res => {
                    this.pages = res.data
                })
        }
    },

    created() {
        this.getAllPages()
    }
}
</script>