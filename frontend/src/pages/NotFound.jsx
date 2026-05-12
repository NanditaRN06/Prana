import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center" data-testid="not-found-page">
            <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
            <p className="text-2xl text-gray-600 mb-8">Page Not Found</p>
            <p className="text-gray-500 mb-8">The page you are looking for doesn't exist or has been moved.</p>
            <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Return to Home
            </Link>
        </div>
    );
};

export default NotFound;
