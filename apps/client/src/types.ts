/**
 * Represents a JSON-compatible object type
 */
export type JsonObject = { [Key in string]: JsonValue };
export type JsonValue = string | number | boolean | null | JsonValue[] | { [Key in string]: JsonValue }; 