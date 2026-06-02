function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      
      {/* Left Section */}
      <div className="hidden md:flex w-1/2 bg-blue-600 text-white items-center justify-center p-10">
        <div>
          <h1 className="text-5xl font-bold mb-4">
            Mentora
          </h1>

          <p className="text-lg text-blue-100">
            Connect Students & Professionals
            in one secure platform.
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100 p-6">
        {children}
      </div>

    </div>
  );
}

export default AuthLayout;