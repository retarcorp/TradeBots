<template>
    <div class="container">
        <div class="row">
            <div class="col-12">
                <label>Путь (может содержать только символы английского алфавита и цифры)</label>
                <input class="input" v-model="page.slug">
                <label>Title</label>
                <input class="input" v-model="page.title">
                <label>Контент</label>
                <input class="input" v-model="page.content">
                
                <!-- <vue-ckeditor v-model="page.content" :config="config" /> -->
                <button :class="{'button--disabled': !isValid}" :disabled="!isValid" @click="onCreatePage">{{ isEdit ? 'Изменить' : 'Создать' }}</button>
                <button @click="clearData">Сбросить</button>
            </div>
            <div class="col-12">
                <div v-for="page in pages" :key='page.id'>
                    <div>{{ page.slug }}</div>
                    <div>{{ page.title }}</div>
                    <div>{{ page.content }}</div>
                    <div><button @click="onEditPage(page)">edit</button></div>
                    <div><button @click="onDeletePage(page.slug)">remove</button></div>
                </div>
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
            isEdit: false,
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
            let regex = /[^a-z0-9]/gi;
            let isValidSlug = regex.test(this.page.slug);
            return this.page.content && this.page.title && !isValidSlug;
        }
    },
    methods: {
        clearData() {
            this.isEdit = false;
            this.page = {
                slug: '',
                title: '',
                content: ''
            }
        },
        onCreatePage() {
            let url = this.isEdit ? '/api/admin/pages/update' : '/api/admin/pages/create'
            this.$axios.post(url, this.page)
                .then(res => {
                    this.clearData()
                    this.isEdit = false;
                    this.$store.commit('setMessage', res.data.message)
                    this.$store.commit('setStatus', res.data.status)
                    this.getAllPages()
                })
                .catch(e => console.info(e))
        },
        getAllPages() {
            this.$axios.$get('/api/admin/pages/getPages')
                .then(res => {
                    this.pages = res.data
                })
        },
        onEditPage(page) {
            this.isEdit = true
            this.page = page
        },
        onDeletePage(slug) {
            this.$axios.$post('/api/admin/pages/remove', { slug })
                .then(res => {
                    this.$store.commit('setMessage', res.data.message)
                    this.$store.commit('setStatus', res.data.status)
                    this.getAllPages()
                })
                .catch(e => console.info(e))
        }
    },

    created() {
        this.getAllPages()
    }
}
</script>