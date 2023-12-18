import { ActionResult } from "./ActionResult";
import { Action } from "./types";

export class LazyAsyncAction implements Action {
  constructor(
    private action: Action,
    private depth = 0,
    private dryRun = false
  ) {}

  protected setDryRun(dryRun: boolean): this {
    this.dryRun = dryRun;
    return this;
  }

  protected setDepth(depth: number): this {
    this.depth = depth;
    return this;
  }

  protected log(message: string): void {
    console.log(" ".repeat(this.depth * 2) + message);
  }

  public async execute(): Promise<ActionResult> {
    return this.dryRun ? this.simulateExecution() : this.performExecution();
  }

  public async simulateExecution() {
    this.log(`Simulating action (Dry Run)`);
    try {
      const simulationResult = await this.action(true);
      return new ActionResult(
        "success",
        "Action would succeed",
        simulationResult
      );
    } catch (error) {
      return new ActionResult("failure", "Action would fail", error);
    }
  }

  public async performExecution() {
    this.log(`Executing action`);
    try {
      const result = await this.action(false);
      return new ActionResult(
        "success",
        "Action executed successfully",
        result
      );
    } catch (error) {
      return error.isBusinessLogicError
        ? new ActionResult("error", error.message)
        : new ActionResult(
            "failure",
            "Action failed due to system error",
            error
          );
    }
  }

  public and(otherAction) {
    return new LazyAsyncAction(
      async (isDryRun: boolean) => {
        await this.setDryRun(isDryRun).execute();
        return await otherAction
          .setDepth(this.depth + 1)
          .setDryRun(isDryRun)
          .execute();
      },
      this.depth,
      this.dryRun
    );
  }

  public or(otherAction) {
    return new LazyAsyncAction(
      async (isDryRun: boolean) => {
        const firstResult = await this.setDryRun(isDryRun).execute();
        if (firstResult.status === "success") {
          return firstResult;
        }
        return await otherAction
          .setDepth(this.depth + 1)
          .setDryRun(isDryRun)
          .execute();
      },
      this.depth,
      this.dryRun
    );
  }

  public not() {
    return new LazyAsyncAction(
      async (isDryRun: boolean) => {
        const result = await this.setDryRun(isDryRun).execute();
        if (result.status === "success") {
          throw new Error("Action succeeded, but 'not' was expected.");
        }
        return new ActionResult(
          "success",
          "Action did not execute as expected"
        );
      },
      this.depth,
      this.dryRun
    );
  }
}
