import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import type React from "react";

const Collapsible: React.FC<React.ComponentProps<typeof CollapsiblePrimitive.Root>> = CollapsiblePrimitive.Root;

const CollapsibleTrigger: React.FC<React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>> = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent: React.FC<React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>> = CollapsiblePrimitive.CollapsibleContent;

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
