import { ActionResult } from "./ActionResult";

export interface Action {
  execute: () => Promise<ActionResult>;
}
