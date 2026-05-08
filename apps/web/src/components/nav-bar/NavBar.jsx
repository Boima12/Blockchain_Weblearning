import React, { useEffect } from 'react';
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
    getAuthSession,
    resetAppState,
    setProfileWalletAddress,
} from '../../utils/appLocalState';
import blockchainWeblearningIcon from '../../assets/Blockchain_weblearning_icon.png';
import { logoutUserAccount } from '../../utils/userAccountApi';

function NavBar() {

    const navigate = useNavigate();
    const authSession = getAuthSession();

    const { address, isConnected } = useAccount();
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

    const onLogout = async () => {
        try {
            await logoutUserAccount();
        } catch {
            // Proceed with local logout even when network request fails.
        }

        clearAuthSession();
        resetAppState();
        navigate('/login');
    };

    const onWalletAction = () => {
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

        disconnect();
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
                <li className={styles.logo}>
                    <img
                        src={blockchainWeblearningIcon}
                        alt='blockchain-weblearning-logo'
                        onClick={() => navigate('/')}
                    />
                </li>

                <li className={styles.coursesButton}>
                    <button
                        type='button'
                        name='courses-button'
                        onClick={() => navigate('/')}
                    >
                        Courses
                    </button>
                </li>

                <SearchBar />

                <li className={styles.createCourseButton}>
                    <button
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
                        Create Course
                    </button>
                </li>

                <li className={styles.profileButton}>
                    <button
                        type='button'
                        name='profile-button'
                        onClick={() =>
                            navigate(isAuthenticated ? '/profile' : '/login')
                        }
                    >
                        {isAuthenticated ? 'Profile' : 'Login'}
                    </button>
                </li>

                <li className={styles.walletButton}>
                    <button
                        type='button'
                        name='wallet-button'
                        onClick={onWalletAction}
                        disabled={walletButtonDisabled}
                    >
                        {walletButtonLabel}
                    </button>
                </li>

                {isAuthenticated ? (
                    <li className={styles.accountLogoutButton}>
                        <button
                            type='button'
                            name='account-logout-button'
                            onClick={onLogout}
                        >
                            Logout Account
                        </button>
                    </li>
                ) : null}
            </ul>
        </nav>
    );
}

export default NavBar;
