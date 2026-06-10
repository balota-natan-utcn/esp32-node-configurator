import { BoardId, SensorId, type SensorInstance } from '../types'
import { BOARDS } from '../data/boards'

export function allocatePins(board: BoardId, sensors: SensorInstance[]): SensorInstance[]
{
    const boardDef = BOARDS.find((b) => b.id === board)!
    const usedPins = new Set<number>()
    const result: SensorInstance[] = []

    const i2cSensors = [SensorId.BME280]
    const analogSensors = [SensorId.MQ135, SensorId.MQ2, SensorId.LDR]
    const dualDigital = [SensorId.HCSR04]

    let adcPool = [...boardDef.adcPins]
    let digitalPool = boardDef.availableGpios.filter((p) => !boardDef.adcPins.includes(p) && !boardDef.restrictedGpios.includes(p))

    const takeDigital = (): number | undefined => 
    {
        const pin = digitalPool.find((p) => !usedPins.has(p))
        if (pin !== undefined) usedPins.add(pin)
            return pin
    }

    const takeAdc = (): number | undefined => 
    {
        const pin = adcPool.find((p) => !usedPins.has(p))
        if (pin !== undefined) usedPins.add(pin)
            return pin
    }

    for (const sensor of sensors)
    {
        const s = { ...sensor }

        if (i2cSensors.includes(s.sensorID))
        {
            s.pin = boardDef.i2cSda // I2C - pins are fixed per board
        }else if (analogSensors.includes(s.sensorID))
        {
            s.pin = takeAdc() // Analog sensors get ADC pins first
        }else if (dualDigital.includes(s.sensorID))
        {
            s.pinTrig = takeDigital()
            s.pinEcho = takeDigital()
        }else
        {
            s.pin = takeDigital() // Digital sensors get remaining digital pins
        }

        result.push(s)
    }
    return result
}