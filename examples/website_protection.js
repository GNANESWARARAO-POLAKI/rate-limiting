/**
 * JavaScript Example: Protecting your website from anonymous users
 * 
 * This shows how to integrate rate limiting into your website's frontend
 * to protect against anonymous users making too many requests.
 */

const RATE_LIMIT_SERVICE = 'http://localhost:8000';
const YOUR_API_KEY = 'demo123'; // Replace with your actual API key

/**
 * Check if anonymous user can make a request
 * @param {string} endpoint - The endpoint name being accessed
 * @returns {Promise<Object>} Rate limit result
 */
async function checkAnonymousUserRateLimit(endpoint = '/api/public') {
    try {
        const response = await fetch(`${RATE_LIMIT_SERVICE}/check-limit-ip`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: YOUR_API_KEY,
                endpoint: endpoint
            })
        });

        if (response.ok) {
            return await response.json();
        } else {
            console.error('Rate limit check failed:', response.status);
            return { allowed: true }; // Fail open
        }
    } catch (error) {
        console.error('Error checking rate limit:', error);
        return { allowed: true }; // Fail open
    }
}

/**
 * Example: Protecting a form submission
 */
async function handleFormSubmission(formData) {
    // Check rate limit before processing
    const rateCheck = await checkAnonymousUserRateLimit('/contact-form');

    if (!rateCheck.allowed) {
        // Show rate limit message to user
        showRateLimitMessage(rateCheck.retry_after);
        return false;
    }

    // Process the form if allowed
    console.log('✅ Processing form submission...');
    console.log(`Remaining requests: ${rateCheck.remaining_quota}`);

    // Your form processing logic here
    return submitForm(formData);
}

/**
 * Example: Protecting API calls
 */
async function fetchPublicData() {
    const rateCheck = await checkAnonymousUserRateLimit('/api/public-data');

    if (!rateCheck.allowed) {
        showRateLimitMessage(rateCheck.retry_after);
        return null;
    }

    // Make the actual API call
    console.log('✅ Fetching public data...');
    return fetch('/api/public-data').then(r => r.json());
}

/**
 * Show friendly rate limit message to users
 */
function showRateLimitMessage(retryAfter) {
    const message = `
        <div class="rate-limit-notice">
            <h3>⏰ Please slow down</h3>
            <p>You've made too many requests. Please wait ${retryAfter} seconds before trying again.</p>
            <p>This helps us keep the service fast for everyone!</p>
        </div>
    `;

    document.getElementById('notifications').innerHTML = message;

    // Auto-hide after retry period
    setTimeout(() => {
        document.getElementById('notifications').innerHTML = '';
    }, retryAfter * 1000);
}

/**
 * Example usage in your website
 */
document.addEventListener('DOMContentLoaded', function () {
    // Protect form submissions
    document.getElementById('contact-form')?.addEventListener('submit', async function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        await handleFormSubmission(formData);
    });

    // Protect search functionality
    document.getElementById('search-button')?.addEventListener('click', async function () {
        const rateCheck = await checkAnonymousUserRateLimit('/search');
        if (rateCheck.allowed) {
            performSearch();
        } else {
            showRateLimitMessage(rateCheck.retry_after);
        }
    });

    // Protect API data loading
    document.getElementById('load-data')?.addEventListener('click', async function () {
        const data = await fetchPublicData();
        if (data) {
            displayData(data);
        }
    });
});

// Placeholder functions for your actual implementation
function submitForm(formData) {
    console.log('Submitting form:', formData);
    return true;
}

function performSearch() {
    console.log('Performing search...');
}

function displayData(data) {
    console.log('Displaying data:', data);
}

console.log('🔒 Anonymous user rate limiting protection loaded!');
console.log('Your website is now protected against abuse from anonymous users.');
