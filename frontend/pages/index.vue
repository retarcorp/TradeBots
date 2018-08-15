<template>
  <section class="container">
      <button @click.prevent="onSendMessage" class="button button--primary">SEND WS MESSAGE</button>
  </section>
</template>

<script>
export default {
  data() {
    return {
      ws: null
    }
  },
  created() {
    this.ws = new WebSocket('ws://localhost:8072/');
    this.ws.onopen = () => {
      console.log("WS подключено");
    }
    this.ws.onclose = (eventClose) => {
      console.log("соеденение закрыто причина:"  + eventclose);
    }
    this.ws.onmessage = (msg) => {
      console.log('Сообщение ' + msg.data)
    }
  },
  methods: {
    onSendMessage() {
      this.ws.send('тест сообщение');
    }
  }
}
</script>

<style>

</style>

