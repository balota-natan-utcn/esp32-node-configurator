import { BoardId } from '../types';

export interface BoardDef
{
    id:                 BoardId
    label:              string
    availableGpios:     number[]
    restrictedGpios:    number[]    //boot pins, ADC2, LED built-in
    adcPins:            number[]    // just ADC1
    i2cSda:             number
    i2cScl:             number
    maxAdcChannels:     number
}

export const BOARDS: BoardDef[] = 
[
    {
        id: BoardId.ESP32_DEV,
        label: 'ESP32 Dev Module',
        availableGpios: [4, 5, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33, 34, 35, 36, 39],
        restrictedGpios: [0, 1, 2, 3, 6, 7, 8, 9, 10, 11],
        adcPins: [32, 33, 34, 35, 36, 39],
        i2cSda: 21,
        i2cScl: 22,
        maxAdcChannels: 6
    },
    {
        id: BoardId.ESP32_C3,
        label: 'ESP32-C3 SuperMini',
        availableGpios: [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 20, 21],
        restrictedGpios: [2, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        adcPins: [0, 1, 2, 3, 4],
        i2cSda: 8,
        i2cScl: 9,
        maxAdcChannels: 4
    },
    {
        id: BoardId.ESP32_S3,
        label: 'ESP32-S3',
        availableGpios:  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 21, 38, 39, 40, 41, 42, 45, 46],
      restrictedGpios:[0, 19, 20, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 43, 44],
      adcPins:         [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      i2cSda: 8,
      i2cScl: 9,
      maxAdcChannels: 10,
    }
]