import { createContext } from "react";

export enum NodeSettingType {
  Constant = "constant",
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
  | { type: NodeSettingType.None; setting: null };

export const NodeSettingsContext = createContext<Map<string, NodeSetting>>(
  null as unknown as Map<string, NodeSetting>
);
