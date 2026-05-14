import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import styles from './NavBar.module.css';
import SearchBar from '../search-bar/SearchBar';
import { useNavigate } from 'react-router-dom';
import {
    useAccount,
    useChainId,
    useConnect,
    useDisconnect,
    useSwitchChain,
} from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import {
    clearAuthSession,
    clearProfileWalletAddress,
    formatWalletAddress,
    getAuthSessionSnapshot,
    loadAppStateFromAccount,
    resetAppState,
    saveAuthSession,
    setProfileWalletAddress,
    subscribeToAuthSession,
} from '../../utils/appLocalState';
import blockchainWeblearningIcon from '../../assets/Blockchain_weblearning_icon.png';
import coursesIcon from '../../assets/courses.png';
import create_courseIcon from '../../assets/create_course.png';
import { loginUserAccount, logoutUserAccount } from '../../utils/userAccountApi';

function NavBar() {

    const navigate = useNavigate();
    const authSession = useSyncExternalStore(
        subscribeToAuthSession,
        getAuthSessionSnapshot,
        () => null,
    );
    const lastLoginRef = useRef({ walletAddress: '', inFlight: false });

    const { address, isConnected, status } = useAccount();
    const { connect, connectors, isPending: isConnecting } = useConnect();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const { switchChain, isPending: isSwitching } = useSwitchChain();

    const isAuthenticated = Boolean(authSession?.accountId);
    const isCorrectNetwork = chainId === polygonAmoy.id;
    const metaMaskConnector =
        connectors.find(
            (connector) =>
                connector.id === 'metaMask' || connector.name === 'MetaMask',
        ) ?? connectors[0];

    useEffect(() => {
        if (isConnected && address) {
            setProfileWalletAddress(address);
            return;
        }

        clearProfileWalletAddress();
    }, [address, isConnected]);

    useEffect(() => {
        if (status !== 'disconnected') {
            return;
        }

        if (!authSession?.accountId) {
            return;
        }

        clearAuthSession();
        resetAppState();
    }, [authSession, status]);

    useEffect(() => {
        if (!isConnected || !address || !isCorrectNetwork) {
            return;
        }

        if (
            authSession?.accountId &&
            String(authSession.walletAddress) === String(address)
        ) {
            return;
        }

        if (lastLoginRef.current.inFlight && lastLoginRef.current.walletAddress === address) {
            return;
        }

        lastLoginRef.current = { walletAddress: address, inFlight: true };

        loginUserAccount({ walletAddress: address })
            .then((payload) => {
                const account = payload?.account;
                if (!account?.accountId) {
                    return;
                }

                const session = saveAuthSession({
                    accountId: String(account.accountId),
                    displayName: String(account?.profile?.displayName ?? ''),
                    walletAddress: String(
                        account?.walletAddress ?? account?.profile?.walletAddress ?? '',
                    ),
                    loggedInAt: new Date().toISOString(),
                });
                loadAppStateFromAccount(account);
            })
            .catch(() => {
                // Keep UI responsive even if auth sync fails.
            })
            .finally(() => {
                lastLoginRef.current = { walletAddress: address, inFlight: false };
            });
    }, [address, authSession, isConnected, isCorrectNetwork]);

    const onWalletAction = async () => {
        if (!isConnected) {
            if (metaMaskConnector) {
                connect({ connector: metaMaskConnector });
            }
            return;
        }

        if (!isCorrectNetwork && switchChain) {
            switchChain({ chainId: polygonAmoy.id });
            return;
        }

        try {
            await logoutUserAccount();
        } catch {
            // Continue with local sign out if API call fails.
        }

        clearAuthSession();
        resetAppState();
        disconnect();
        navigate('/');
    };

    const walletButtonDisabled =
        isConnecting ||
        isSwitching ||
        (!metaMaskConnector && !isConnected);

    let walletButtonLabel = 'Connect Wallet';
    if (!metaMaskConnector && !isConnected) {
        walletButtonLabel = 'Install MetaMask';
    } else if (isConnected && !isCorrectNetwork) {
        walletButtonLabel = 'Switch to Amoy';
    } else if (isConnected) {
        walletButtonLabel = `Disconnect ${formatWalletAddress(address ?? '')}`;
    }

    return (
        <nav className={styles.nav}>
            <ul className={styles.ul}>
                <li className={styles.leftSection}>
                    <img
                        className={styles.logo}
                        src={blockchainWeblearningIcon}
                        alt='blockchain-weblearning-logo'
                        onClick={() => navigate('/')}
                    />

                    <button
                        className={styles.coursesButton}
                        type='button'
                        name='courses-button'
                        onClick={() => navigate('/')}
                    >
                        <img src={coursesIcon} alt='courses-icon' />
                        <p>Courses</p>
                    </button>
                </li>

                <li className={styles.rightSection}>
                    {isAuthenticated ? (
                        <>
                            <button
                                className={styles.createCourseButton}
                                type='button'
                                name='create-course-button'
                                onClick={() =>
                                    navigate(
                                        isAuthenticated
                                            ? '/create-course'
                                            : '/login',
                                    )
                                }
                            >
                                <img src={create_courseIcon} alt='create-course-icon' />
                                <p>Create Course</p>
                            </button>

                            <button
                                className={styles.profileButton}
                                type='button'
                                name='profile-button'
                                onClick={() =>
                                    navigate(isAuthenticated ? '/profile' : '/login')
                                }
                            >
                                Profile
                            </button>
                        </>
                    ) : null}

                    <button
                        className={styles.walletButton}
                        type='button'
                        name='wallet-button'
                        onClick={onWalletAction}
                        disabled={walletButtonDisabled}
                    >
                        {walletButtonLabel}
                    </button>

                </li>
            </ul>
        </nav>
    );
}

export default NavBar;
