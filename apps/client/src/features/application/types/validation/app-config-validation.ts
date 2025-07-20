export interface AppConfigValidationResult {
  readonly isValid: boolean;
  readonly errors: ConfigValidationIssue[];
  readonly warnings: ConfigValidationWarning[];
  readonly suggestions: ConfigValidationSuggestion[];
}

export interface ConfigValidationIssue {
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
  readonly severity: "error" | "warning" | "info";
}

export interface ConfigValidationWarning {
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
  readonly suggestion?: string;
}

export interface ConfigValidationSuggestion {
  readonly field: string;
  readonly message: string;
  readonly suggestedValue?: unknown;
  readonly reason?: string;
}
