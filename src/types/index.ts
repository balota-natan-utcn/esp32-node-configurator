export enum NodeType
{
    MAIN        = 'MAIN',
    SECONDARY   = 'SECONDARY',
    LEAF        = 'LEAF',
    SEMI_MAIN   = 'SEMI_MAIN',
}

export enum BoardId
{
    ESP32_DEV = 'ESP32_DEV',
    ESP32_C3 = 'ESP32_C3',
    ESP32_S3 = 'ESP32_S3',
}

export enum SensorId
{
    DHT22       = 'DHT22',
    BME280      = 'BME280',
    MQ135       = 'MQ135',
    MQ2         = 'MQ2',
    LDR         = 'LDR',
    HCSR04      = 'HCSR04',
    REED_NO     = 'REED_NO',
    REED_NC     = 'REED_NC',
    PIR_501     = 'PIR_501',
    PIR_AM312   = 'PIR_AM312',
    RELAY       = 'RELAY',
}

export enum WakeMode
{
    EVENT_DRIVEN = 'EVENT_DRIVEN',
    TIMER        = 'TIMER',
}

export interface SensorInstance
{
    id: string;         //uuid generated for each sensor instance
    sensorID: SensorId;
    jsonKey: string;    //ex: "window_bedroom" - used in JSON
    pin?: number;       //alocated automatically or added manually
    pinTrig?: number;
    pinEcho?: number;
}

export interface NetworkConfig 
{
    routerSsid:     string
    routerPassword: string
    masterMac:      string
    nodeTimeout:    number     //default 15000
    sendInterval:   number    //how often the secondary node sends data - default 6000
}

export interface LeafConfig
{
    wakeMode:       WakeMode
    timerSleepSec:  number    //used only if wakeMode == TIMER - default 300
}

export interface NodeConfig
{
    nodeType:       NodeType
    nodeName:       string      //ex: "Bedroom"
    board:          BoardId
    sensors:        SensorInstance[]
    network:        NetworkConfig
    leafConfig?:    LeafConfig  //only for LEAF
}