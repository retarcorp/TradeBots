<template>
    <div class="container">
        <div class="row">
            <div class="col-3">
                <button @click="settings = !settings" class="button button--primary">Создать/обновить страницу</button>
            </div>
            <div v-show='settings' class="col-12">
                <label>Путь (может содержать только символы английского алфавита и цифры)</label>
                <input class="input" v-model="page.slug">
                <label>Title</label>
                <input class="input" v-model="page.title">
                <label>Контент</label>
                
                <vckeditor v-model="page.content" :config="config" />
                <button :class="{'button--disabled': !isValid}" :disabled="!isValid" @click="onCreatePage">{{ isEdit ? 'Изменить' : 'Создать' }}</button>
                <button @click="clearData">Сбросить</button>
            </div>
            <div class="col-12">
                <table class="table">
                        <tr class="table__tr">
                            <th class="table__th">Путь</th>
                            <th class="table__th pair-head">Заголовок</th>
                            <th class="table__th"></th>
                            <th class="table__th"></th>
                        </tr>
                        <tbody class='overflow'>
                            <tr 
                                v-for="page in pages" :key='page.id' 
                                class="table__tr">
                                <td class="table__td">{{ page.slug }}</td>
                                <td class="table__td">{{ page.title }}</td>
                                <td class="table__td"><button @click="onEditPage(page)" class="button button--primary">edit</button></td>
                                <td class="table__td"><button @click="onDeletePage(page.slug)" class="button button--danger">remove</button></td>
                            </tr>
                        </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
import vckeditor from 'vue-ckeditor2';
export default {
    components: { vckeditor },
    layout: 'admin',
    head: {
        script: [
            {
                src: "https://unpkg.com/vue-ckeditor2"
            }
        ]
    },
    data() {
        return {
            isEdit: false,
            pages: [],
            settings: false,
            page: {
                slug: '',
                title: '',
                content: ''
            },
            config: {
                toolbar: [
                    { name: 'document', items: [ 'Source', '-', 'Save', 'NewPage', 'Preview', 'Print', '-', 'Templates' ] },
                    { name: 'clipboard', items: [ 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo' ] },
                    { name: 'editing', items: [ 'Find', 'Replace', '-', 'SelectAll', '-', 'Scayt' ] },
                    { name: 'forms', items: [ 'Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField' ] },
                    '/',
                    { name: 'basicstyles', items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'CopyFormatting', 'RemoveFormat' ] },
                    { name: 'paragraph', items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'BidiLtr', 'BidiRtl', 'Language' ] },
                    { name: 'links', items: [ 'Link', 'Unlink', 'Anchor' ] },
                    { name: 'insert', items: [ 'Image', 'Flash', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak', 'Iframe' ] },
                    '/',
                    { name: 'styles', items: [ 'Styles', 'Format', 'Font', 'FontSize' ] },
                    { name: 'colors', items: [ 'TextColor', 'BGColor' ] },
                    { name: 'tools', items: [ 'Maximize', 'ShowBlocks' ] },
                    { name: 'about', items: [ 'About' ] }
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
                    this.settings = !this.settings;
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
            this.settings = true;
            this.isEdit = true;
            this.page = page;
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