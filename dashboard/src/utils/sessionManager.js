// Session management utilities
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const saveUserSession = (userData) => {
    const sessionData = {
        user: userData,
        timestamp: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION
    };

    localStorage.setItem('rateLimit_session', JSON.stringify(sessionData));
};

export const getUserSession = () => {
    try {
        const sessionData = localStorage.getItem('rateLimit_session');
        if (!sessionData) return null;

        const session = JSON.parse(sessionData);

        // Check if session has expired
        if (Date.now() > session.expiresAt) {
            clearUserSession();
            return null;
        }

        return session.user;
    } catch (error) {
        console.error('Error reading user session:', error);
        clearUserSession();
        return null;
    }
};

export const clearUserSession = () => {
    localStorage.removeItem('rateLimit_session');
    // Also clear old keys for backwards compatibility
    localStorage.removeItem('rateLimit_user');
    localStorage.removeItem('rateLimit_isLoggedIn');
};

export const extendSession = () => {
    const sessionData = localStorage.getItem('rateLimit_session');
    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);
            session.expiresAt = Date.now() + SESSION_DURATION;
            localStorage.setItem('rateLimit_session', JSON.stringify(session));
        } catch (error) {
            console.error('Error extending session:', error);
        }
    }
};
