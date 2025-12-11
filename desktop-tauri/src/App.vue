<script setup lang="ts">
import { Button } from '@/components/ui/button'
import NavBar from './components/custom/shared/NavBar.vue';
// import { CreateUserDto } from '@common-types'
// import type { CreateUserDto } from '../../server/common-types'
import type { CreateUserDto } from '@common-types/index'


const user: CreateUserDto = {
  email: '',
  provider: 'email'
}
console.log(user);

</script>

<template>
  <h1>You did it!</h1>
  <p>
    Visit <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a> to read the
    documentation
  </p>

    <div>
      
      <NavBar />
    <div class="text-cyan-700 font-black text-8xl">
      YO
    </div>
    <div>
      <Button>Click me</Button>
    </div>
  </div>

</template>

<style scoped></style>


