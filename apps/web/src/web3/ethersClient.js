import { BrowserProvider, Contract, Interface, isAddress, parseEther, parseUnits } from 'ethers';
import { courseRegistryAbi } from './abi/courseRegistryAbi';
import { coursePurchaseAbi } from './abi/coursePurchaseAbi';
import { certificateNftAbi } from './abi/certificateNftAbi';
import { getContractAddresses } from './contractAddresses';

const AMOY_CHAIN_ID = 80002n;
const AMOY_CHAIN_ID_HEX = '0x13882';
const AMOY_CHAIN_PARAMS = {
    chainId: AMOY_CHAIN_ID_HEX,
    chainName: 'Polygon Amoy',
    nativeCurrency: {
        name: 'POL',
        symbol: 'POL',
        decimals: 18,
    },
    rpcUrls: ['https://rpc-amoy.polygon.technology/'],
    blockExplorerUrls: ['https://amoy.polygonscan.com/'],
};
const MIN_PRIORITY_FEE = parseUnits('30', 'gwei');
const MIN_MAX_FEE = parseUnits('60', 'gwei');

const getInjectedProvider = () => {
    if (!window?.ethereum) {
        throw new Error('MetaMask is not available. Please install or enable it.');
    }

    return window.ethereum;
};

const getProvider = () => new BrowserProvider(getInjectedProvider());

const requestAmoyNetworkSwitch = async () => {
    const injectedProvider = getInjectedProvider();

    try {
        await injectedProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: AMOY_CHAIN_ID_HEX }],
        });
        return;
    } catch (error) {
        if (error?.code !== 4902) {
            throw error;
        }
    }

    await injectedProvider.request({
        method: 'wallet_addEthereumChain',
        params: [AMOY_CHAIN_PARAMS],
    });
};

const ensureAmoyNetwork = async (provider, { promptSwitch = false } = {}) => {
    const { chainId } = await provider.getNetwork();

    if (chainId !== AMOY_CHAIN_ID) {
        if (!promptSwitch) {
            throw new Error('Please switch your wallet to Polygon Amoy and try again.');
        }

        await requestAmoyNetworkSwitch();

        const refreshedNetwork = await provider.getNetwork();
        if (refreshedNetwork.chainId !== AMOY_CHAIN_ID) {
            throw new Error('Please switch your wallet to Polygon Amoy and try again.');
        }
    }
};

const getSigner = async (options = {}) => {
    const provider = getProvider();
    await ensureAmoyNetwork(provider, options);
    return provider.getSigner();
};

const buildGasOverrides = async (options = {}) => {
    const provider = getProvider();
    await ensureAmoyNetwork(provider, options);

    // MetaMask / some RPCs do not implement eth_maxPriorityFeePerGas (EIP-1559).
    // getFeeData() may throw or return nulls; fall back to legacy gasPrice.
    try {
        const feeData = await provider.getFeeData();
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
        const maxFeePerGas = feeData.maxFeePerGas;

        if (
            maxPriorityFeePerGas != null &&
            maxFeePerGas != null &&
            maxPriorityFeePerGas > 0n &&
            maxFeePerGas > 0n
        ) {
            const priority =
                maxPriorityFeePerGas > MIN_PRIORITY_FEE
                    ? maxPriorityFeePerGas
                    : MIN_PRIORITY_FEE;
            const feeCap =
                maxFeePerGas > priority ? maxFeePerGas : priority * 2n;

            return {
                maxPriorityFeePerGas: priority,
                maxFeePerGas: feeCap > MIN_MAX_FEE ? feeCap : MIN_MAX_FEE,
            };
        }
    } catch {
        // Fall through to legacy gas price.
    }

    let gasPrice = MIN_MAX_FEE;
    try {
        const fromNetwork = await provider.getGasPrice();
        if (fromNetwork > gasPrice) {
            gasPrice = fromNetwork;
        }
    } catch {
        // Use minimum floor.
    }

    return { gasPrice };
};

const getReadOnlyContracts = async (options = {}) => {
    const provider = getProvider();
    await ensureAmoyNetwork(provider, options);

    const addresses = getContractAddresses();

    return {
        registry: new Contract(addresses.registry, courseRegistryAbi, provider),
        purchase: new Contract(addresses.purchase, coursePurchaseAbi, provider),
        certificate: new Contract(addresses.certificate, certificateNftAbi, provider),
    };
};

const getSignerContracts = async (options = {}) => {
    const signer = await getSigner(options);
    const addresses = getContractAddresses();

    return {
        registry: new Contract(addresses.registry, courseRegistryAbi, signer),
        purchase: new Contract(addresses.purchase, coursePurchaseAbi, signer),
        certificate: new Contract(addresses.certificate, certificateNftAbi, signer),
    };
};

const parseCourseCreatedEvent = (receipt) => {
    if (!receipt?.logs?.length) {
        return null;
    }

    const iface = new Interface(courseRegistryAbi);

    for (const log of receipt.logs) {
        try {
            const parsed = iface.parseLog(log);
            if (parsed?.name === 'CourseCreated') {
                return Number(parsed.args?.courseId);
            }
        } catch {
            // Ignore non-matching logs.
        }
    }

    return null;
};

export const createCourseOnChain = async (metadataCID, priceWei, options = {}) => {
    if (!metadataCID) {
        throw new Error('Metadata CID is required to publish on-chain.');
    }

    const onStatus = typeof options.onStatus === 'function' ? options.onStatus : null;

    onStatus?.('switch-network');
    const { registry } = await getSignerContracts({ promptSwitch: true });
    onStatus?.('signing');
    const gasOverrides = await buildGasOverrides({ promptSwitch: true });
    const tx = await registry.createCourse(metadataCID, priceWei, gasOverrides);
    onStatus?.('submitted', tx.hash);
    const receipt = await tx.wait();
    onStatus?.('confirmed', tx.hash);

    return {
        txHash: tx.hash,
        courseId: parseCourseCreatedEvent(receipt),
    };
};

export const buyCourseOnChain = async (courseId, priceInMatic, options = {}) => {
    if (!Number.isFinite(Number(courseId))) {
        throw new Error('Invalid course id.');
    }

    const onStatus = typeof options.onStatus === 'function' ? options.onStatus : null;

    onStatus?.('switch-network');
    const { purchase } = await getSignerContracts({ promptSwitch: true });
    const priceWei =
        typeof priceInMatic === 'bigint'
            ? priceInMatic
            : parseEther(String(priceInMatic));

    onStatus?.('signing');
    const gasOverrides = await buildGasOverrides({ promptSwitch: true });
    const tx = await purchase.buyCourse(courseId, { value: priceWei, ...gasOverrides });
    onStatus?.('submitted', tx.hash);
    await tx.wait();
    onStatus?.('confirmed', tx.hash);

    return {
        txHash: tx.hash,
    };
};

export const hasAccessOnChain = async (courseId, walletAddress) => {
    if (!Number.isFinite(Number(courseId))) {
        throw new Error('Invalid course id.');
    }

    if (!isAddress(walletAddress)) {
        throw new Error('Invalid wallet address.');
    }

    const { purchase } = await getReadOnlyContracts({ promptSwitch: false });
    return purchase.hasAccess(courseId, walletAddress);
};

export const mintCertificateOnChain = async (courseId, studentAddress, metadataURI, options = {}) => {
    if (!Number.isFinite(Number(courseId))) {
        throw new Error('Invalid course id.');
    }

    if (!isAddress(studentAddress)) {
        throw new Error('Invalid student address.');
    }

    if (!metadataURI) {
        throw new Error('Metadata URI is required to mint a certificate.');
    }

    const onStatus = typeof options.onStatus === 'function' ? options.onStatus : null;

    onStatus?.('switch-network');
    const { certificate } = await getSignerContracts({ promptSwitch: true });
    onStatus?.('signing');
    const gasOverrides = await buildGasOverrides({ promptSwitch: true });
    const tx = await certificate.mintCertificate(studentAddress, courseId, metadataURI, gasOverrides);
    onStatus?.('submitted', tx.hash);
    await tx.wait();
    onStatus?.('confirmed', tx.hash);

    return {
        txHash: tx.hash,
    };
};
