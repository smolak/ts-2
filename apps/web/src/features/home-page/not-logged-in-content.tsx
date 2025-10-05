import Link from "next/link";

export const NotLoggedInContent = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">Welcome to the app!</h1>
      <p className="mt-4 text-center text-lg">Sign in to access the app's features.</p>
      <div className="mt-8">
        <Link href="/auth/sign-in" className="btn btn-primary">
          Sign in
        </Link>
      </div>
    </div>
  );
};
