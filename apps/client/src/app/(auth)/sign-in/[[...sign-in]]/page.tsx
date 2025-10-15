import { SignIn } from "@clerk/nextjs";

export default function Page(): React.ReactElement {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "hsl(var(--background))",
      }}
    >
      <SignIn
        afterSignInUrl="/"
        signUpUrl="/sign-up"
        routing="path"
        path="/sign-in"
      />
    </div>
  );
}
