import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface AuthFormProps {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
}

/**
 * Authentication form component that handles user input for authentication flows.
 *
 * @explanation
 * The AuthForm provides a standardized form interface for authentication operations.
 * It implements:
 * 1. Form submission handling with support for both sync and async actions
 * 2. Flexible child component rendering for different auth scenarios (login, signup)
 * 3. Email field pre-population capability
 * 4. Consistent styling with responsive padding and gap spacing
 *
 * The component is designed to be reusable across different authentication
 * contexts while maintaining a consistent user experience. It uses the native
 * Form component for handling submissions and provides a structured layout
 * for authentication-related input fields and controls.
 *
 * @param {AuthFormProps} props - The component props
 * @param {string | ((formData: FormData) => void | Promise<void>)} props.action - Form submission handler
 * @param {React.ReactNode} props.children - Child components to render within the form
 * @param {string} [props.defaultEmail=''] - Optional default email to pre-populate the form
 * @returns {JSX.Element} The rendered authentication form
 */
export function AuthForm({
  action,
  children,
  defaultEmail = "",
}: AuthFormProps): JSX.Element {
  return (
    <form 
      action={action} 
      className="flex flex-col gap-4 px-4 sm:px-16"
    >
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="email"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >{`Email Address`}</Label>

        <Input
          id="email"
          name="email"
          className="bg-muted text-md md:text-sm"
          type="email"
          placeholder="user@acme.com"
          autoComplete="email"
          required
          autoFocus
          defaultValue={defaultEmail}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >{`Password`}</Label>

        <Input
          id="password"
          name="password"
          className="bg-muted text-md md:text-sm"
          type="password"
          required
        />
      </div>

      {children}
    </form>
  );
}
