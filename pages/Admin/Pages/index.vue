<template>
    <div class="container">
        <div class="row">
            <div class="col">
                <label>Путь</label>
                <input class="input" v-model="page.slug">
                <input class="input" v-model="page.title">
                <input class="input" v-model="page.content">
                
                <!-- <vue-ckeditor v-model="page.content" :config="config" /> -->
                <button @click="onCreatePage">Create</button>
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
    methods: {
        onCreatePage() {
            this.$axios.post('/api/admin/pages/create/', this.page)
                .then(res => {
                    console.log(res.data)
                })
                .catch(e => console.info(e))
        }
    },

    created() {
        
    }
}
</script>