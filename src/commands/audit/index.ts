import { Command, OptionValues } from "commander";

export function register(command: Command): Command {
  command
    .command("audit")
    .description("Audit data")
    .option("--since <date>", "Audit data since a specific date")
    .action(async (options: OptionValues) => {
      const action = auditAction(options.since);
      const result = await action.execute();
      console.log(`Result: ${result.status}, Message: ${result.message}`);
    });
  return command;
}
