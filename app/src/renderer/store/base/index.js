import Vue from 'vue';
import minimist from 'minimist';

import { getAccountSource } from '__gConfig/accountConfig';
import { readJsonSync, outputJsonSync } from '__gUtils/fileUtils';
import { KF_CONFIG_PATH, TASK_EXTENSION_DIR } from '__gConfig/pathConfig';
import { getExtensionConfigs } from '__gUtils/busiUtils';


export default {
    
    state: {
        tasks: null, // 系统内正在运行的tasks
        calendar: { //交易日等相关日期信息
           
        },
        processStatus: {},
        processStatusWithDetail: {},
        tdAccountSource: {}, //账户柜台信息
        mdAccountSource: {}, //账户柜台信息
        kfConfig: {}, // kf 
        
        taskExts: [], // task插件.
        currentTask: {},
        taskExtConfigList: []
    },

    actions: {

        setProcessStatus ({ commit }, processStatus) {
            commit('SET_PROCESS_STATUS', processStatus)
        },

        setProcessStatusWithDetail ({ commit }, processStatusWithDetail) {
            commit('SET_PROCESS_STATUS_WITH_DETAIL', processStatusWithDetail)
        },

        setTdAccountSource ({ commit }, tdAccountSource) {
            commit('SET_TD_ACCOUNT_SOURCE', tdAccountSource)
        },

        setMdAccountSource ({ commit }, mdAccountSource) {
            commit('SET_MD_ACCOUNT_SOURCE', mdAccountSource)
        },

        //初始化kfconfig
        setKungfuConfig ({ commit }, kfConfig) {
            commit('SET_KF_CONFIG', kfConfig)  
            
        },

        //部分更新kfConfig
        setKungfuConfigByKeys ({ commit, state }, kfConfig) {
            commit('SET_KF_CONFIG', kfConfig)  
            outputJsonSync(KF_CONFIG_PATH, 
                {
                    ...state.kfConfig,
                    ...kfConfig
                }
            )
        },

        getAccountSourceConfig ({ dispatch }) {
            return getAccountSource()
            .then(accountSource => {
                dispatch('setTdAccountSource', accountSource.td)
                dispatch('setMdAccountSource', accountSource.md)
                return accountSource
            })
        },

        //初始化kungfu trader
        getKungfuConfig ({ dispatch }) {
            const kfConfig = readJsonSync(KF_CONFIG_PATH)
            dispatch('setKungfuConfig', kfConfig)
        },

        setTaskExts ({ commit }, exts) {
            commit('SET_TASK_EXTS', exts)
        },

        setCurrentTask ({ commit }, currentTask) {
            commit('SET_CURRENT_TASK', currentTask)
        },

        getExtensionConfigs ({ commit }) {
            return getExtensionConfigs(TASK_EXTENSION_DIR)
                .then(exts => {
                    commit('SET_TASK_EXTENSION_CONFIGS', Object.freeze(exts.filter(({ type }) => type === 'task')))
                })
        },
    },

    mutations: {

        SET_TASK_EXTENSION_CONFIGS (state, taskExtConfigList) {
            state.taskExtConfigList = taskExtConfigList
        },

        SET_CURRENT_TASK (state, task) {
            state.currentTask = Object.freeze(task);
        },

        SET_TASK_EXTS (state, exts) {
            state.taskExts = exts
        },
        
        SET_PROCESS_STATUS (state, processStatus) {
            state.processStatus = processStatus
        },

        SET_PROCESS_STATUS_WITH_DETAIL (state, processStatusWithDetail) {
            state.processStatusWithDetail = processStatusWithDetail
        },
        
        SET_TD_ACCOUNT_SOURCE (state, tdAccountSource) {
            state.tdAccountSource = tdAccountSource
        },
        
        SET_MD_ACCOUNT_SOURCE (state, mdAccountSource) {
            state.mdAccountSource = mdAccountSource
        },
        
        SET_KF_CONFIG (state, kfConfig) {
            Object.keys(kfConfig || {}).forEach(key => {
                Vue.set(state.kfConfig, key, kfConfig[key])
            })
        }
    },

    getters: {
        
        currentTaskMode (state, getters) {
            const currentTask = state.currentTask || {};
            const args = currentTask.args || [];
            const minimistConfig = getters.taskExtMinimistConfig;
            const argsConfig = minimist(args, minimistConfig);
            return argsConfig.sim ? 'sim' : 'real'
        },

        taskExtMinimistConfig (state) {
            //sim 为系统内置
            let minimistConfig = {
                string: [],
                boolean: ['sim'],
            };
            state.taskExtConfigList.forEach(config => {
                const c = config.config;
                c.forEach(item => {
                    const { key, type } = item;
                    if (type === 'instrumentId') {
                        if (!minimistConfig.string.includes(key)) {
                            minimistConfig.string.push(key)                        
                        }
                    }

                    if (type === 'bool') {
                        if (!minimistConfig.boolean.includes(key)) {
                            minimistConfig.boolean.push(key)
                        }
                    }
                })
            })

            return minimistConfig
        },

        ifMasterLedgerRunning (state) {
            const processStatus = state.processStatus || {};
            const masterIsRunning = processStatus.master === 'online';
            const ledgerIsRunning = processStatus.ledger === 'online';
        
            return masterIsRunning && ledgerIsRunning
        }
    }
}
