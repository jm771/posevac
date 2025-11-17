import { createContext } from "react";

export type IONodeSetting = {
  index: number;
};

export enum NodeSettingType {
  Constant = "constant",
  Input = "input",
  Output = "output",
  None = "none",
}

export function makeDefaultSettings(type: NodeSettingType): NodeSetting {
  switch (type) {
    case NodeSettingType.Constant:
      return {
        type: NodeSettingType.Constant,
        setting: {
          value: 0,
          repeat: false,
        },
      };
    case NodeSettingType.None:
    case NodeSettingType.Input:
    case NodeSettingType.Output:
      return {
        type: NodeSettingType.None,
        setting: null,
      };
  }
}

export type ConstantNodeSettings = {
  value: number;
  repeat: boolean;
};

export type NodeSetting =
  | {
      type: NodeSettingType.Constant;
      setting: ConstantNodeSettings;
    }
  | { type: NodeSettingType.None; setting: null }
  | { type: NodeSettingType.Input; setting: IONodeSetting }
  | { type: NodeSettingType.Output; setting: IONodeSetting };

export const NodeSettingsContext = createContext<Map<string, NodeSetting>>(
  null as unknown as Map<string, NodeSetting>
);
