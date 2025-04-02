import { createRouter, createWebHistory } from 'vue-router';
import Home from './components/Home.vue';
import Game from './components/Game.vue';


const routes = [
  { path: '/', component: Home, name: 'home' },
  { path: '/game', component: Game, name: 'game' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;