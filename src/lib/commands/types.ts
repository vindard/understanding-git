export interface CommandResult {
  output: string;
  success: boolean;
}

export type CommandHandler = (args: string[]) => Promise<CommandResult>;
