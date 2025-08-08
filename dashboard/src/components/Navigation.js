import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = ({ user, onLogout }) => {
  return (
    <nav className="bg-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link to="/" className="text-white text-base sm:text-xl font-bold flex items-center">
              <span className="text-lg sm:text-xl mr-1 sm:mr-2">🚀</span>
              <span className="hidden sm:inline">Rate Limiting Service</span>
              <span className="sm:hidden">Rate Limiter</span>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1 sm:space-x-3 lg:space-x-4">
            {user ? (
              <>
                {/* Welcome message - hidden on mobile */}
                <span className="hidden md:inline text-white text-sm lg:text-base truncate max-w-32 lg:max-w-none">
                  Welcome, {user.name}!
                </span>
                
                {/* Logout button */}
                <button
                  onClick={onLogout}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">🚪</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-blue-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-700 hover:bg-blue-800 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
