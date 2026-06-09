import { SensorId, NodeType } from '../types'
export type Interface = 'DIGITAL' | 'ANALOG' | 'I2C' |'ONE_WIRE' | 'DUAL_DIGITAL'

export interface SensorDef
{
    id:              SensorId
    label:           string
    interface:       Interface
    compatibleNodes: NodeType[]
    maxCount:        number
    defaultJsonKey:  string
    notes:           string
}

export const SENSORS: SensorDef[] = [
{
      id: SensorId.DHT22,
      label: 'DHT22 (AM2302)',
      interface: 'ONE_WIRE',
      compatibleNodes: [NodeType.SECONDARY, NodeType.SEMI_MAIN],
      maxCount: 2,
      defaultJsonKey: 'dht22',
      notes: 'Rezistență pull-up 10kΩ necesară între DATA și VCC',
    },
    {
      id: SensorId.BME280,
      label: 'BME280',
      interface: 'I2C',
      compatibleNodes: [NodeType.SECONDARY, NodeType.SEMI_MAIN],
      maxCount: 2,
      defaultJsonKey: 'bme280',
      notes: 'Temperatură + Umiditate + Presiune atmosferică',
    },
    {
      id: SensorId.MQ135,
      label: 'MQ-135 (calitate aer)',
      interface: 'ANALOG',
      compatibleNodes: [NodeType.SECONDARY, NodeType.SEMI_MAIN],
      maxCount: 2,
      defaultJsonKey: 'air_quality',
      notes: 'Preheat 24h pentru calibrare precisă',
    },
    {
      id: SensorId.MQ2,
      label: 'MQ-2 (gaze/fum)',
      interface: 'ANALOG',
      compatibleNodes: [NodeType.SECONDARY, NodeType.SEMI_MAIN],
      maxCount: 2,
      defaultJsonKey: 'gas_level',
      notes: 'Detectează gaze inflamabile și fum',
    },
    {
      id: SensorId.LDR,
      label: 'LDR / Fotorezistență',
      interface: 'ANALOG',
      compatibleNodes: [NodeType.SECONDARY, NodeType.SEMI_MAIN],
      maxCount: 2,
      defaultJsonKey: 'light_level',
      notes: 'Necesită divizor de tensiune',
    },
    {
      id: SensorId.HCSR04,
      label: 'HC-SR04 (ultrasonic)',
      interface: 'DUAL_DIGITAL',
      compatibleNodes: [NodeType.SECONDARY, NodeType.SEMI_MAIN],
      maxCount: 2,
      defaultJsonKey: 'distance_cm',
      notes: 'Alimentare 5V; ECHO la 5V → divizor de tensiune recomandat',
    },
    {
      id: SensorId.REED_NO,
      label: 'Reed Switch NO',
      interface: 'DIGITAL',
      compatibleNodes: [NodeType.SECONDARY, NodeType.SEMI_MAIN,
  NodeType.LEAF],
      maxCount: 4,
      defaultJsonKey: 'reed',
      notes: 'Normally Open — circuit se închide când magnetul e prezent',
    },
    {
      id: SensorId.REED_NC,
      label: 'Reed Switch NC',
      interface: 'DIGITAL',
      compatibleNodes: [NodeType.SECONDARY, NodeType.SEMI_MAIN,
  NodeType.LEAF],
      maxCount: 4,
      defaultJsonKey: 'reed',
      notes: 'Normally Closed — circuit se deschide când magnetul e prezent',
    },
    {
      id: SensorId.PIR_501,
      label: 'PIR SR501',
      interface: 'DIGITAL',
      compatibleNodes: [NodeType.SECONDARY, NodeType.SEMI_MAIN,
  NodeType.LEAF],
      maxCount: 2,
      defaultJsonKey: 'motion',
      notes: '3.3V sau 5V, interval și sensibilitate ajustabile',
    },
    {
      id: SensorId.PIR_AM312,
      label: 'PIR AM312',
      interface: 'DIGITAL',
      compatibleNodes: [NodeType.SECONDARY, NodeType.SEMI_MAIN,
  NodeType.LEAF],
      maxCount: 2,
      defaultJsonKey: 'motion',
      notes: 'Doar 3.3V, format miniatur',
    },
    {
      id: SensorId.RELAY,
      label: 'Releu',
      interface: 'DIGITAL',
      compatibleNodes: [NodeType.SECONDARY, NodeType.SEMI_MAIN],
      maxCount: 4,
      defaultJsonKey: 'relay',
      notes: 'Modul cu optocuplor recomandat',
    },
  ]