import { BrowserProvider, Contract, Interface, isAddress, parseEther, parseUnits } from 'ethers';
import { courseRegistryAbi } from './abi/courseRegistryAbi';
import { coursePurchaseAbi } from './abi/coursePurchaseAbi';
import { certificateNftAbi } from './abi/certificateNftAbi';
import { getContractAddresses } from './contractAddresses';

const AMOY_CHAIN_ID = 80002n;
const MIN_PRIORITY_FEE = parseUnits('30', 'gwei');
const MIN_MAX_FEE = parseUnits('60', 'gwei');

const getInjectedProvider = () => {
    if (!window?.ethereum) {
        throw new Error('MetaMask is not available. Please install or enable it.');
    }

    return window.ethereum;
};

const getProvider = () => new BrowserProvider(getInjectedProvider());

const ensureAmoyNetwork = async (provider) => {
    const { chainId } = await provider.getNetwork();

    if (chainId !== AMOY_CHAIN_ID) {
        throw new Error('Please switch your wallet to Polygon Amoy and try again.');
    }
};

const getSigner = async () => {
    const provider = getProvider();
    await ensureAmoyNetwork(provider);
    return provider.getSigner();
};

const buildGasOverrides = async () => {
    const provider = getProvider();
    await ensureAmoyNetwork(provider);

    const feeData = await provider.getFeeData();
    const maxPriorityFeePerGas =
        feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas > MIN_PRIORITY_FEE
            ? feeData.maxPriorityFeePerGas
            : MIN_PRIORITY_FEE;

    const maxFeePerGas =
        feeData.maxFeePerGas && feeData.maxFeePerGas > maxPriorityFeePerGas
            ? feeData.maxFeePerGas
            : maxPriorityFeePerGas * 2n;

    return {
        maxPriorityFeePerGas,
        maxFeePerGas: maxFeePerGas > MIN_MAX_FEE ? maxFeePerGas : MIN_MAX_FEE,
    };
};

const getReadOnlyContracts = async () => {
    const provider = getProvider();
    await ensureAmoyNetwork(provider);

    const addresses = getContractAddresses();

    return {
        registry: new Contract(addresses.registry, courseRegistryAbi, provider),
        purchase: new Contract(addresses.purchase, coursePurchaseAbi, provider),
        certificate: new Contract(addresses.certificate, certificateNftAbi, provider),
    };
};

const getSignerContracts = async () => {
    const signer = await getSigner();
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

export const createCourseOnChain = async (metadataCID, priceWei) => {
    if (!metadataCID) {
        throw new Error('Metadata CID is required to publish on-chain.');
    }

    const { registry } = await getSignerContracts();
    const gasOverrides = await buildGasOverrides();
    const tx = await registry.createCourse(metadataCID, priceWei, gasOverrides);
    const receipt = await tx.wait();

    return {
        txHash: tx.hash,
        courseId: parseCourseCreatedEvent(receipt),
    };
};

export const buyCourseOnChain = async (courseId, priceInMatic) => {
    if (!Number.isFinite(Number(courseId))) {
        throw new Error('Invalid course id.');
    }

    const { purchase } = await getSignerContracts();
    const priceWei =
        typeof priceInMatic === 'bigint'
            ? priceInMatic
            : parseEther(String(priceInMatic));

    const gasOverrides = await buildGasOverrides();
    const tx = await purchase.buyCourse(courseId, { value: priceWei, ...gasOverrides });
    await tx.wait();

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

    const { purchase } = await getReadOnlyContracts();
    return purchase.hasAccess(courseId, walletAddress);
};

export const mintCertificateOnChain = async (courseId, studentAddress, metadataURI) => {
    if (!Number.isFinite(Number(courseId))) {
        throw new Error('Invalid course id.');
    }

    if (!isAddress(studentAddress)) {
        throw new Error('Invalid student address.');
    }

    if (!metadataURI) {
        throw new Error('Metadata URI is required to mint a certificate.');
    }

    const { certificate } = await getSignerContracts();
    const gasOverrides = await buildGasOverrides();
    const tx = await certificate.mintCertificate(studentAddress, courseId, metadataURI, gasOverrides);
    await tx.wait();

    return {
        txHash: tx.hash,
    };
};
