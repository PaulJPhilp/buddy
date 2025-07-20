import React from "react";
import { ApplicationUI } from "../components/ApplicationUI"; // Import the new ApplicationUI
import { useApplication } from "../hooks/useApplicationHook";

type ApplicationContainerProps = {};

export function ApplicationContainer({}: ApplicationContainerProps) {
  const { appConfig, isLoading, error, isConfigLoaded, loadAppConfig } =
    useApplication();

  // Optional: Trigger initial load if not already loaded
  React.useEffect(() => {
    if (!isConfigLoaded && !isLoading && !appConfig) {
      loadAppConfig(); // Or load a specific default config path
    }
  }, [isConfigLoaded, isLoading, appConfig, loadAppConfig]);

  // ApplicationUI will handle its own loading/error states if passed, or show based on AppConfig presence
  // ApplicationUI component is now responsible for handling the loading and error states for the entire application UI.
  // It receives these states as props from the ApplicationContainer.
  return <ApplicationUI isLoading={isLoading} error={error} />;
}
