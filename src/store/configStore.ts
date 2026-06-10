import { create } from 'zustand'
import { NodeType, BoardId, WakeMode, type NodeConfig, type SensorInstance } from '../types'

interface WizardState
{
    step: number
    config: NodeConfig
    setStep: (step: number) => void
    nextStep: () => void
    prevStep: () => void
    setNodeType: (nodeType: NodeType) => void
    setNodeName: (name: string) => void
    setBoard: (board: BoardId) => void
    addSensor: (sensor: SensorInstance) => void
    removeSensor: (id: string) => void
    updateSensor: (id: string, updated: Partial<SensorInstance>) => void
    setNetworkField: <K extends keyof NodeConfig['network']>(key: K, value: NodeConfig['network'][K]) => void
    setLeafField: <K extends keyof NonNullable<NodeConfig['leafConfig']>>(key: K, value: NonNullable<NodeConfig['leafConfig']>[K]) => void
    loadConfig: (config: NodeConfig) => void
    reset: () => void
}

const defaultConfig = (): NodeConfig => ({
    nodeType: NodeType.SECONDARY,
    nodeName: '',
    board: BoardId.ESP32_DEV,
    sensors: [],
    network:
    {
        routerSsid: '',
        routerPassword: '',
        masterMac: '',
        nodeTimeout: 15000,
        sendInterval: 60000,
    },
    leafConfig:
    {
        wakeMode: WakeMode.EVENT_DRIVEN,
        timerSleepSec: 300,
    },
})

export const useConfigStore = create<WizardState>((set) => ({
    step: 0,
    config: defaultConfig(),

    setStep: (step) => set({ step }),
    nextStep: () => set((s) => ({ step: s.step + 1 })),
    prevStep: () => set((s) => ({ step: Math.max(0, s.step - 1)})),

    setNodeType: (nodeType) => set((s) => ({ config: { ...s.config, nodeType } })),
    setNodeName: (nodeName) => set((s) => ({ config: { ...s.config, nodeName } })),
    setBoard: (board) => set((s) => ({ config: { ...s.config, board, sensors: [] } })),

    addSensor: (sensor) => set((s) => ({ config: { ...s.config, sensors: [...s.config.sensors, sensor] } })),
    removeSensor: (id) => set((s) => ({ config: { ...s.config, sensors: s.config.sensors.filter((x) => x.id !== id) } })),
    updateSensor: (id, changes) => set((s) => ({ config: { ...s.config, sensors: s.config.sensors.map((x) => (x.id === id ? { ...x, ...changes } : x)), }, })),

    setNetworkField: (key, value) => set((s) => ({ config: { ...s.config, network: { ...s.config.network, [key]: value } } })),
    setLeafField: (key, value) => set((s) => ({ config: { ...s.config, leafConfig: { ...s.config.leafConfig!, [key]: value } } })),

    loadConfig: (config) => set({ config, step: 0 }),
    reset: () => set ({ step: 0, config: defaultConfig() }),
}))