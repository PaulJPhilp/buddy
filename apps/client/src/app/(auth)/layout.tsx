// app/auth/layout.tsx
import AuthLayout from "@components/app/auth-layout";

export default function AuthLayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AuthLayout>{children}</AuthLayout>;
}
