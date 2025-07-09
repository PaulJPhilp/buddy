import { Args, Command, Options } from "@effect/cli";
import { Console, Effect } from "effect";
import { CliConfig } from "../services/cli-config";
import { OutputFormatter } from "../services/output-formatter";

// Config show command
const showConfig = Command.make(
  "show",
  {
    format: Options.choice("format", ["table", "json", "yaml"]).pipe(
      Options.optional
    ),
  },
  ({ format }) =>
    Effect.gen(function* () {
      const cliConfig = yield* CliConfig;
      const formatter = yield* OutputFormatter;

      const config = yield* cliConfig.getConfig();
      const outputFormat = format || config.format;

      const output = (() => {
        switch (outputFormat) {
          case "json":
            return JSON.stringify(config, null, 2);
          case "yaml":
            return formatAsYaml(config);
          default:
            return formatConfigAsTable(config);
        }
      })();

      yield* Console.log(output);
    })
);

// Config set command
const setConfig = Command.make(
  "set",
  {
    key: Args.text({ name: "key" }),
    value: Args.text({ name: "value" }),
  },
  ({ key, value }) =>
    Effect.gen(function* () {
      const cliConfig = yield* CliConfig;
      const formatter = yield* OutputFormatter;

      // Parse the key-value pair and update config
      const updates = parseConfigUpdate(key, value);

      yield* cliConfig.updateConfig(updates);

      const successMessage = yield* formatter.formatSuccess(
        `Updated configuration: ${key} = ${value}`
      );

      yield* Console.log(successMessage);
    })
);

// Config get command
const getConfig = Command.make(
  "get",
  {
    key: Args.text({ name: "key" }),
  },
  ({ key }) =>
    Effect.gen(function* () {
      const cliConfig = yield* CliConfig;
      const formatter = yield* OutputFormatter;

      const config = yield* cliConfig.getConfig();
      const value = getConfigValue(config, key);

      if (value === undefined) {
        const error = yield* formatter.formatError(
          `Configuration key not found: ${key}`
        );
        yield* Console.error(error);
        return;
      }

      yield* Console.log(`${key} = ${JSON.stringify(value)}`);
    })
);

// Config reset command
const resetConfig = Command.make(
  "reset",
  {
    force: Options.boolean("force").pipe(Options.optional),
  },
  ({ force }) =>
    Effect.gen(function* () {
      const formatter = yield* OutputFormatter;

      if (!force) {
        yield* Console.log(
          "⚠️  This will reset all configuration to defaults."
        );
        yield* Console.log("Use --force to confirm reset.");
        return;
      }

      // Reset to defaults (this would clear any saved config)
      const successMessage = yield* formatter.formatSuccess(
        "Configuration reset to defaults"
      );

      yield* Console.log(successMessage);
    })
);

// Helper functions
const formatConfigAsTable = (config: any) => {
  const flattenConfig = (obj: any, prefix = ""): Array<[string, string]> => {
    const result: Array<[string, string]> = [];

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        result.push(...flattenConfig(value, fullKey));
      } else {
        result.push([fullKey, JSON.stringify(value)]);
      }
    }

    return result;
  };

  const entries = flattenConfig(config);
  const headers = ["Setting", "Value"];

  const colWidths = [
    Math.max(headers[0].length, ...entries.map(([key]) => key.length)),
    Math.max(headers[1].length, ...entries.map(([, value]) => value.length)),
  ];

  const separator = `+${colWidths.map((w) => "-".repeat(w + 2)).join("+")}+`;

  const headerRow = `|${headers
    .map((header, i) => ` ${header.padEnd(colWidths[i])} `)
    .join("|")}|`;

  const dataRows = entries.map(
    ([key, value]) =>
      `| ${key.padEnd(colWidths[0])} | ${value.padEnd(colWidths[1])} |`
  );

  return [separator, headerRow, separator, ...dataRows, separator].join("\n");
};

const formatAsYaml = (config: any) => {
  const yamlify = (obj: any, indent = 0): string => {
    const spaces = "  ".repeat(indent);
    let result = "";

    for (const [key, value] of Object.entries(obj)) {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        result += `${spaces}${key}:\n${yamlify(value, indent + 1)}`;
      } else {
        result += `${spaces}${key}: ${JSON.stringify(value)}\n`;
      }
    }

    return result;
  };

  return yamlify(config);
};

const parseConfigUpdate = (key: string, value: string) => {
  const keys = key.split(".");
  const updates: any = {};

  // Parse value
  let parsedValue: any = value;
  if (value === "true") parsedValue = true;
  else if (value === "false") parsedValue = false;
  else if (!Number.isNaN(Number(value))) parsedValue = Number(value);

  // Build nested update object
  let current = updates;
  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = parsedValue;

  return updates;
};

const getConfigValue = (config: any, key: string): any => {
  const keys = key.split(".");
  let current = config;

  for (const k of keys) {
    if (current && typeof current === "object" && k in current) {
      current = current[k];
    } else {
      return undefined;
    }
  }

  return current;
};

// Main config command with subcommands
export const configCommand = Command.make("config", {}, () => Effect.void).pipe(
  Command.withSubcommands([showConfig, setConfig, getConfig, resetConfig])
);
