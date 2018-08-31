<template>
    <div class="modal-wrapper">
        <div class="modal">
            <form class="container-fluid">
                <h1 class="title title--big modal__title">title</h1>
                <div class="row">
                    <div class="col">
                        <div class="form-control">
                            <label class="label">Название</label>
                            <input class="input" type="text">
                        </div>
                        <div class="form-control">
                            <label class="label">Цена</label>
                            <input class="input" type="text">
                        </div>
                        <div class="form-control">
                            <label class="label">Макс. кол-во ботов</label>
                            <input class="input" type="text">
                        </div>
                    </div>
                    <div class="col">
                        <div class="form-control">
                            <label class="label">Возможности</label>
                            <textarea class="input"></textarea>
                        </div>
                        <div class="form-control">
                            <label class="label">Макс. кол-во ботов</label>
                            <input class="input" type="text">
                        </div>
                    </div>
                </div>
                <button class="button button--success">Сохранить</button>
            </form>
        </div>
    </div>
</template>

<script>
    export default {
        props: {
            open: {
                type: Boolean,
                required: true,
                default: false
            }
        },
        data() {
            return {

            }
        }
    }
</script>

<style>
.modal-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    background-color: rgba(0,0,0,0.4);
    overflow: auto;
}
.modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9999;
    max-width: 545px;
    padding: 2rem;
}

.modal__title {
    margin-bottom: 2.5rem;
}
</style>
