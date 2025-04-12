import Form from 'next/form';

import { Input } from '@ui/components/ui/input';

interface AuthFormProps {
    action: (formData: FormData) => void;
    defaultEmail?: string;
    children: React.ReactNode;
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
export function AuthForm({ action, defaultEmail, children }: AuthFormProps) {
    return (
        <Form action={action} className="flex flex-col">
            <div className="mb-2">
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Email"
                    defaultValue={defaultEmail}
                    required
                    className="h-8 w-full border-0 bg-gray-100 px-2 text-sm"
                />
            </div>
            <div>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Password"
                    required
                    className="h-8 w-full border-0 bg-gray-100 px-2 text-sm"
                />
            </div>
            {children}
        </Form>
    );
}
