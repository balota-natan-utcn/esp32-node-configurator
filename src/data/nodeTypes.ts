import { NodeType } from '../types'

export interface NodeTypeDef {
    id:          NodeType
    label:       string
    description: string
    color:       string  // Tailwind color class pentru UI
}

export const NODE_TYPES: NodeTypeDef[] = [
{
    id: NodeType.MAIN,
    label: 'Nod Principal',
    description: 'Primește date de la nodurile secundare via ESP-NOW și le servește ca JSON prin HTTP.',
    color: 'cyan',
},
{
    id: NodeType.SECONDARY,
    label: 'Nod Secundar',
    description: 'Citește senzori și trimite periodic date la nodul principal via ESP-NOW.',
    color: 'green',
},
{
    id: NodeType.LEAF,
    label: 'Leaf Node',
    description: 'Deep sleep event-driven; se trezește la schimbare de stare reed/PIR și trimite imediat.',
    color: 'yellow',
},
{
    id: NodeType.SEMI_MAIN,
    label: 'Nod Semi-Principal',
    description: 'Agregator intermediar pentru clădiri mari — primește de la secundare și retransmite la principal.',
    color: 'purple',
},
]