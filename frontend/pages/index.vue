<template>
  <section class="container">
      <button @click.prevent="onSendMessage" class="button button--primary">SEND WS MESSAGE</button>
  </section>
</template>

<script>
export default {
  computed: {
    ws() {
      return this.$store.getters.getWs
    },
    wsID() {
      return this.$store.getters.getWsId
    }
  },
  methods: {
    onSendMessage() {
      this.ws.send({
        id: this.wsID,
        msg: 'hello'
      });
    }
  }
}
</script>

<style>

</style>

