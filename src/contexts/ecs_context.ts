import { createContext } from "react";
import { mapIterable, NotNull } from "../util";

export enum OverclockMode {
  Regular = "Regular",
  Zip = "Zip",
  Cartesian = "Cartesian",
}

export type OverclockComponent = {
  mode: OverclockMode;
};

export type OtherComponent = {
  val: string;
};

export enum EcsComponent {
  Overclock,
  Component2,
}

export type ComponentPairs =
  | {
      kind: EcsComponent.Overclock;
      val: OverclockComponent;
    }
  | {
      kind: EcsComponent.Component2;
      val: OtherComponent;
    };

type LookupByKind<K> = Extract<ComponentPairs, { kind: K }>;
type ValForKey<K> = LookupByKind<K>["val"];
// type ValForKey<K> = ComponentPairs extends { kind: K; val: infer V }
//   ? V
//   : never;
type FactoryTuple = ComponentPairs extends { kind: infer K; val: infer V }
  ? [K, () => V | null]
  : never;

function makeKey(entityId: string, kind: EcsComponent) {
  return `${entityId}-comp-${kind}`;
}

export class EntityComponents {
  private readonly map = new Map<string, ComponentPairs["val"]>();
  private readonly keys = new Map<string, [string, EcsComponent]>();
  private readonly factories: Map<FactoryTuple[0], FactoryTuple[1]>;

  constructor(factories: FactoryTuple[], ecs: EntityComponents | null) {
    this.factories = new Map(factories);

    if (ecs != null) {
      for (const [[id, comp], val] of ecs.GetAllComponents()) {
        this.MakeComponent(id, comp, val);
      }
    }
  }

  GetComponent<K extends ComponentPairs["kind"]>(
    entityId: string,
    kind: K
  ): ValForKey<K> | null {
    const key = makeKey(entityId, kind);
    // @ts-ignore
    let res: ValForKey<K> | undefined = this.map.get(key);
    if (res === undefined) {
      this.keys.set(key, [entityId, kind]);
      // @ts-ignore
      res = NotNull(this.factories.get(kind))() as ValForKey<K>;
      this.map.set(key, res);
    }

    // @ts-ignore
    return res;
  }

  MakeComponent<KV extends ComponentPairs>(
    entityId: string,
    kind: KV["kind"],
    val: KV["val"]
  ) {
    const key = makeKey(entityId, kind);
    this.keys.set(key, [entityId, kind]);
    this.map.set(key, val);
  }

  GetAllComponents(): [[string, EcsComponent], ComponentPairs["val"]][] {
    return mapIterable(this.map.entries(), ([key, val]) => [
      NotNull(this.keys.get(key)),
      val,
    ]);
  }
}

export const EntityComponentsContext = createContext<EntityComponents>(
  null as unknown as EntityComponents
);
