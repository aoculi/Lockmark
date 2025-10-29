
import { useEffect, useState } from 'react';
import { useLogout } from '../../hooks/auth';
import { keystoreManager } from '../../store';
import styles from './styles.module.css';

export default function Vault() {
    const logoutMutation = useLogout();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // Check keystore status on mount
    useEffect(() => {
        const checkKeystoreStatus = async () => {
            try {
                const unlocked = await keystoreManager.isUnlocked();
                setIsUnlocked(unlocked);
            } catch (error) {
                console.error('Failed to check keystore status:', error);
                setIsUnlocked(false);
            } finally {
                setIsChecking(false);
            }
        };

        checkKeystoreStatus();
    }, []);

    const handleLogout = async () => {
        try {
            await logoutMutation.mutateAsync();
            // The mutation will handle clearing session and redirect via App component
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    if (isChecking) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <p>Checking vault status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Vault</h2>
                <button
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className={`${styles.logoutButton} ${logoutMutation.isPending ? styles.logoutButtonDisabled : ''}`}
                >
                    {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                </button>
            </div>

            <div className={styles.card}>
                {isUnlocked ? (
                    <>
                        <p className={styles.successMessage}>🔓 Vault Unlocked</p>
                        <p>Your vault is unlocked and ready to use.</p>
                        <p>All sensitive data is stored in memory only.</p>
                        <p>Keys will be cleared when you close the extension or logout.</p>
                    </>
                ) : (
                    <>
                        <p className={styles.errorMessage}>🔒 Vault Locked</p>
                        <p>Your vault is locked. Please login again to unlock it.</p>
                        <p>This may happen if the extension was restarted or keys were cleared.</p>
                    </>
                )}
            </div>
        </div>
    );
}
