
/* eslint-disable */
import './errorCatch';
import Vue from 'vue';
import './setKungfuParamsOnWindow';
import store from '@/store';
import router from './routers';
import * as utils from '__gUtils/busiUtils'
import ElementUI from 'element-ui';
import Components from '@/assets/components'
import { remote } from 'electron'

import App from './App.vue';
import '@/assets/iconfont/iconfont.js';
import '@/assets/iconfont/iconfont.css';
import '@/assets/scss/makeOrder.scss';

Vue.use(ElementUI)

Vue.config.productionTip = false
Vue.store = Vue.prototype.$store = store
Vue.utils = Vue.prototype.$utils = utils

//tr 组件
Vue.use(Components)



new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app', true)


const { startGetProcessStatus, startMaster, startLedger, startArchiveMakeTask, _pm2 } = require('__gUtils/processUtils');

startArchiveMakeTask((archiveStatus) => {
    window.archiveStatus = archiveStatus
})
.then(() => startMaster(false))
.catch(err => console.error(err.message))
.finally(() => {
    startGetProcessStatus(res => {
        const { processStatus, processStatusWithDetail } = res;
        Vue.store.dispatch('setProcessStatus', processStatus)
        Vue.store.dispatch('setProcessStatusWithDetail', processStatusWithDetail)
    });

    utils.delayMiliSeconds(1000)
        .then(() => startLedger(false))
        .catch(err => console.error(err.message))
})

window.ELEC_WIN_MAP = new Set();

const currentWin = remote.getCurrentWindow()
currentWin.on('close', (e) => {
    Array.from(window.ELEC_WIN_MAP).forEach(winId => {
        const win = remote.BrowserWindow.fromId(winId)
        win && win.close && win.close()
    })
})

window.pm2 = _pm2;


