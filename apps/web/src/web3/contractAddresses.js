const ensureAddress = (value, label) => {
    if (!value) {
        throw new Error(`${label} is not set in environment variables.`);
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
        throw new Error(`${label} is not a valid address.`);
    }

    return value;
};

export const getContractAddresses = () => ({
    registry: ensureAddress(import.meta.env.VITE_REGISTRY_ADDRESS, 'VITE_REGISTRY_ADDRESS'),
    purchase: ensureAddress(import.meta.env.VITE_PURCHASE_ADDRESS, 'VITE_PURCHASE_ADDRESS'),
    certificate: ensureAddress(import.meta.env.VITE_CERTIFICATE_ADDRESS, 'VITE_CERTIFICATE_ADDRESS'),
});
