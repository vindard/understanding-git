export interface CompletionResult {
  suggestions: string[];
  replaceFrom: number;
  replaceTo: number;
}

export interface CompletionContext {
  line: string;
  lineUpToCursor: string;
  cursorPos: number;
  parts: string[];
  cmd: string;
  endsWithSpace: boolean;
}

export interface CompletionStrategy {
  canHandle(context: CompletionContext): boolean;
  complete(context: CompletionContext): Promise<CompletionResult>;
}
