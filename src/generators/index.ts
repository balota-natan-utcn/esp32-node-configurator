import { NodeType } from '../types'
import type { NodeConfig } from '../types'
import { generateMainNode }      from './mainNode'
import { generateSecondaryNode } from './secondaryNode'
import { generateLeafNode }      from './leafNode'
import { generateMacHelper }     from './helpers/macAddressHelper'

export const MESH_PROTOCOL_H = `// ============================================================
// mesh_protocol.h  -  Copie IDENTICA pe TOATE placile ESP32
// ============================================================
#pragma once

#define MAX_SENSORS        8
#define MAX_REED_SENSORS   4
#define NODE_NAME_LEN     16

enum SensorType : uint8_t {
  SENSOR_TEMP        = 1,
  SENSOR_HUMID       = 2,
  SENSOR_GAS         = 3,
  SENSOR_POWER       = 4,
  SENSOR_FLOOD       = 5,
  SENSOR_LIGHT       = 6,
  SENSOR_DISTANCE    = 7,
  SENSOR_PRESSURE    = 8,
};

struct SensorPayload {
  uint8_t type;
  float   value;
};

struct ReedPayload {
  char json_key[20];
  bool closed;
};

struct MessagePayload {
  char          node_name[NODE_NAME_LEN];
  uint8_t       sensor_count;
  SensorPayload sensors[MAX_SENSORS];
  uint8_t       reed_count;
  ReedPayload   reed_sensors[MAX_REED_SENSORS];
};
`

export interface GeneratedFile {
  name:    string
  content: string
  folder:  string
}

export function generateFiles(config: NodeConfig): GeneratedFile[] {
  const files: GeneratedFile[] = []
  const ts   = Date.now()
  const slug = config.nodeName.replace(/\s+/g, '_') || 'nod'

  let mainSketch = ''
  if (config.nodeType === NodeType.MAIN) {
    mainSketch = generateMainNode(config)
  } else if (config.nodeType === NodeType.SECONDARY || config.nodeType === NodeType.SEMI_MAIN) {
    mainSketch = generateSecondaryNode(config)
  } else if (config.nodeType === NodeType.LEAF) {
    mainSketch = generateLeafNode(config)
  }

  files.push({
    name:    `${slug}.ino`,
    content: mainSketch,
    folder:  'main',
  })

  files.push({
    name:    'mesh_protocol.h',
    content: MESH_PROTOCOL_H,
    folder:  'main',
  })

  files.push({
    name:    'get_mac_address.ino',
    content: generateMacHelper(),
    folder:  'helpers',
  })

  return files
}
