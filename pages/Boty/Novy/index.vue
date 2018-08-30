<template>
    <div class="container-fluid newBot">
        <div class="row">
            <div class="col-12">
                <div class="title title--big newBot__title">Добавить бота</div>
                <div class="newBot__mode">
                    <div class="newBot__mode-item">
                        <input v-model="mode" name="mode" type="radio" id="auto" value="0">
                        <label class="newBot__mode-label" for="auto">Автоматический режим</label>
                    </div>
                    <div class="newBot__mode-item">
                        <input v-model="mode" name="mode" type="radio" id="manual" value="1">
                        <label class="newBot__mode-label" for="manual">Ручной</label>
                    </div>
                </div>
            </div>
            <div class="col-12">
                <transition name="page">
                    <keep-alive>
                        <component :mode="mode" :is="currentComponent"></component>
                    </keep-alive>
                </transition>
            </div>
        </div>
    </div>
</template>

<script>
import BotAutomatic from '~/components/NewBot/Automatic';
import BotManual from '~/components/NewBot/Manual';
export default {
    componetns: {
        BotAutomatic,
        BotManual
    },
    data() {
        return {
            mode: '0'
        }
    },
    computed: {
        currentComponent() {
            return this.mode === '0' ? BotAutomatic
            : BotManual
        }
    }
}
</script>

<style scoped>
.newBot__mode {
    display: flex;
    margin-bottom: 3.5rem
}

.newBot__mode-item:not(:last-child) {
    margin-right: .8rem;
}
</style>