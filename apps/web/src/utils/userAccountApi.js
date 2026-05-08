const AUTH_API_BASE = '/api/auth';
const USER_ACCOUNT_API_BASE = '/api/user-account';

const parseApiResponse = async (response, fallbackErrorMessage) => {
    let payload = {};

    try {
        payload = await response.json();
    } catch {
        payload = {};
    }

    if (!response.ok) {
        throw new Error(payload?.error || fallbackErrorMessage);
    }

    return payload;
};

export const registerUserAccount = async ({
    displayName,
    email,
    walletAddress,
    password,
}) => {
    const response = await fetch(`${AUTH_API_BASE}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            displayName,
            email,
            walletAddress,
            password,
        }),
    });

    return parseApiResponse(response, 'Unable to register account.');
};

export const loginUserAccount = async ({ identifier, password }) => {
    const response = await fetch(`${AUTH_API_BASE}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            identifier,
            password,
        }),
    });

    return parseApiResponse(response, 'Unable to login with those credentials.');
};

export const logoutUserAccount = async () => {
    const response = await fetch(`${AUTH_API_BASE}/logout`, {
        method: 'POST',
    });

    return parseApiResponse(response, 'Unable to logout right now.');
};

export const syncUserAccountState = async (accountId, statePayload) => {
    const normalizedAccountId = String(accountId ?? '').trim();
    if (!normalizedAccountId) {
        throw new Error('Account id is required to sync user state.');
    }

    const response = await fetch(
        `${USER_ACCOUNT_API_BASE}/${normalizedAccountId}/state`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(statePayload),
        },
    );

    return parseApiResponse(response, 'Unable to sync account state.');
};
