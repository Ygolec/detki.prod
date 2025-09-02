<template>
  <v-dialog
      :model-value="modelValue"
      @update:model-value="onUpdate"
      fullscreen
  >
    <v-card variant="text" class="menu-card d-flex align-center justify-center">
      <!-- Close (X) button in top-right -->
      <v-btn class="dialog-close" icon="mdi-close" variant="text" @click="emit('update:modelValue', false)"/>

      <img src="/labels/detkiBlack.svg" alt="logo" class="dialog-logo"/>
      <img src="/labels/allProjects.svg" alt="logo" class="center-image"/>
      <v-virtual-scroll
          v-if="projects"
          :items="projects"
          max-height="60vh"
      >
        <template v-slot:default="{ item }">
          <v-card class="pa-4 item-list" variant="text" @click="onClickItem(item)">
            <v-row no-gutters class="align-start">
              <!-- ЛЕВАЯ ЧАСТЬ -->
              <v-col cols="12" md="10" class="pr-md-4">
                <div class="title-box">
                  {{ item.name || item.title }}
                </div>
              </v-col>

              <!-- ПРАВАЯ ЧАСТЬ -->
              <v-col cols="12" md="2" class="d-flex flex-column justify-space-between align-end right-col">
                <div class="date">[{{ (item.date || item.year || '').toString().slice(0,4) }}]</div>
                <div class="utils">{{ Array.isArray(item.tools) ? item.tools.join(', ') : item.tools }}</div>
              </v-col>
            </v-row>
          </v-card>
        </template>
      </v-virtual-scroll>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {createDirectus, readItem, readItems, rest} from "@directus/sdk";

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void; (e: 'open-video', id: string | number): void }>()
const projects = ref<any[] | null>(null)

async function getProjects() {
  const origin = process.client ? window.location.origin : useRequestURL().origin
  projects.value = await $fetch(`${origin}/api/projects/list`)
}

function onUpdate(val: boolean) {
  emit('update:modelValue', val)
}

function onClickItem(item: any) {
  if (!item) return
  const id = item.id
  if (id !== undefined && id !== null) {
    emit('open-video', id)
  }
}

onMounted(() => {
  getProjects();
})
</script>

<style scoped>
.item-list {
  width: 35vw;
  cursor: pointer;
}

.title-box {
  display: inline-block;
  border: 1.5px solid rgba(0, 0, 0, .7);
  font-family: Georgia, serif; /* как в примере */
  font-size: clamp(24px, 4vw, 50px);
  letter-spacing: 0.2em;
  line-height: 1.1;
  color: rgba(0, 0, 0, .85);
  transform: scaleY(1.4);
}

.menu-card {
  background-color: #EEEEEE;
  opacity: 0.5;
  position: relative;
}

.dialog-close {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
}

.date {
  margin-bottom: 20px;
}

.center-image {
  display: block;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 20px;
}

.buttons-url {
  margin-bottom: 20vh;
}

.image {
  height: 20vh;
}

.dialog-logo {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  height: 4vh;
  z-index: 2;
  pointer-events: none;
}
</style>
