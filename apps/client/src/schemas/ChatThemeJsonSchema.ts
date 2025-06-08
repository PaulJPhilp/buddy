import * as S from "@effect/schema/Schema";

/**
 * ChatThemeJson: JSON serializable theme schema for chat apps.
 * All defaults should be defined in the `container` section.
 */
export interface ChatThemeJson {
  container: {
    borderColor: string;
    defaults: {
      headerBar: ChatThemeJson["headerBar"];
      chatArea: ChatThemeJson["chatArea"];
    };
  };
  headerBar: {
    height: number;
    color: string;
    font: string;
    fontStyle: string;
    fontSize: number;
    fontColor: string;
  };
  chatArea: {
    userBubble: {
      color: string;
      font: string;
      fontStyle: string;
      fontSize: number;
      fontColor: string;
      padding: string;
    };
    assistantBubble: {
      color: string;
      font: string;
      fontStyle: string;
      fontSize: number;
      fontColor: string;
      padding: string;
    };
    userArea: {
      attachmentToolbar: {
        color: string;
        iconColor: string;
        iconSize: number;
        font: string;
        fontStyle: string;
        fontSize: number;
        fontColor: string;
        padding: string;
      };
      inputArea: {
        inactiveRingColor: string;
        inactiveRingWidth: number;
        activeRingColor: string;
        activeRingWidth: number;
        inputAreaColor: string;
        font: string;
        fontStyle: string;
        fontSize: number;
        fontColor: string;
      };
      agentToolbar: {
        color: string;
        iconColor: string;
        iconSize: number;
        font: string;
        fontStyle: string;
        fontSize: number;
        fontColor: string;
        padding: string;
        selectorBackgroundColor: string;
      };
    };
  };
}

// Effect schema for runtime validation
const HeaderBarSchema = S.Struct({
  height: S.Number,
  color: S.String,
  font: S.String,
  fontStyle: S.String,
  fontSize: S.Number,
  fontColor: S.String,
});

const BubbleSchema = S.Struct({
  color: S.String,
  font: S.String,
  fontStyle: S.String,
  fontSize: S.Number,
  fontColor: S.String,
  padding: S.String,
});

const ToolbarSchema = S.Struct({
  color: S.String,
  iconColor: S.String,
  iconSize: S.Number,
  font: S.String,
  fontStyle: S.String,
  fontSize: S.Number,
  fontColor: S.String,
  padding: S.String,
});

const AgentToolbarSchema = S.Struct({
  color: S.String,
  iconColor: S.String,
  iconSize: S.Number,
  font: S.String,
  fontStyle: S.String,
  fontSize: S.Number,
  fontColor: S.String,
  padding: S.String,
  selectorBackgroundColor: S.String,
});

const InputAreaSchema = S.Struct({
  inactiveRingColor: S.String,
  inactiveRingWidth: S.Number,
  activeRingColor: S.String,
  activeRingWidth: S.Number,
  inputAreaColor: S.String,
  font: S.String,
  fontStyle: S.String,
  fontSize: S.Number,
  fontColor: S.String,
});

const UserAreaSchema = S.Struct({
  attachmentToolbar: ToolbarSchema,
  inputArea: InputAreaSchema,
  agentToolbar: AgentToolbarSchema,
});

const ChatAreaSchema = S.Struct({
  userBubble: BubbleSchema,
  assistantBubble: BubbleSchema,
  userArea: UserAreaSchema,
});

export const ChatThemeJsonSchema = S.Struct({
  container: S.Struct({
    borderColor: S.String,
    defaults: S.Struct({
      headerBar: HeaderBarSchema,
      chatArea: ChatAreaSchema,
    }),
  }),
  headerBar: HeaderBarSchema,
  chatArea: ChatAreaSchema,
});
