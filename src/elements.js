import { defineCustomElement } from 'vue';
import ShaclVue from '@/components/ShaclVue.vue';

export function registerShaclVue() {
  const elements = [
    { name: 'shacl-vue', component: ShaclVue },
  ];

  elements.forEach(({ name, component }) => {
    if (!customElements.get(name)) {
      customElements.define(name, defineCustomElement(component));
    }
  });
}