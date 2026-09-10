import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-3">
      <h1 className="font-serif text-3xl">Page not found</h1>
      <p className="text-muted text-sm">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary mt-2">
        Back to home
      </Link>
    </div>
  );
}
