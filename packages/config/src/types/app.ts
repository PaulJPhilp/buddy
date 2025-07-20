export interface AppConfig {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly style: AppStyle;
}

export interface AppStyle {
  readonly background?: string;
  readonly foreground?: string;
  readonly fontFamily?: string;
  readonly headerHeight?: string;
  readonly headerBackground?: string;
  readonly headerForeground?: string;
  readonly headerBorder?: string;
  readonly headerShadow?: string;
  readonly sidebarWidth?: string;
  readonly sidebarBackground?: string;
  readonly sidebarForeground?: string;
  readonly sidebarBorder?: string;
  readonly mainBackground?: string;
  readonly mainForeground?: string;
  readonly authButtonBackground?: string;
  readonly authButtonForeground?: string;
  readonly authButtonHoverBackground?: string;
}
