"use client";

import { useWorkspaceActions } from "@/hooks/useWorkspace";
import type { WorkspaceEntry } from "@/managers/workspace-component/types";
import { useEffect, useState } from "react";
// TODO: Fix dialog import - temporarily commented out to resolve module resolution
// import {
