import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import styles from "./token-claim-section.module.scss";
import { useWhitelist } from "../../hooks/token-airdrop/use-whitelist";
import { useClaimTokens } from "../../hooks/token-airdrop/use-claim-tokens";

const TokenClaimSection: React.FC = () => {
    const { publicKey } = useWallet();
    const { checkWhitelist } = useWhitelist();
    const { claimTokens } = useClaimTokens();
    const [loading, setLoading] = useState(false);
    const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);
    const [claimed, setClaimed] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchWhitelistStatus = async () => {
            if (!publicKey) return;
            const result = await checkWhitelist(publicKey);
            setIsWhitelisted(result);
        };

        fetchWhitelistStatus().catch(console.error);
    }, [publicKey, checkWhitelist]);

    const handleClaim = async () => {
        try {
            setLoading(true);
            setErrorMessage(null);
            await claimTokens();
            setClaimed(true);
            console.log("Tokens claimed!");
        } catch (err) {
            console.log("Error: " + err);
            setErrorMessage("Failed to claim tokens. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!publicKey) return null;
    if (isWhitelisted === null) return <p className={styles.message}>Checking whitelist...</p>;

    return (
        <div className={styles.claimContainer}>
            {claimed ? (
                <p className={styles.message}>✅ Tokens successfully claimed! 🎉</p>
            ) : isWhitelisted ? (
                <>
                    <p className={styles.message}>Congrats, you've been awarded 🎉</p>
                    <button
                        onClick={handleClaim}
                        disabled={loading}
                        className={styles.claimButton}
                    >
                        {loading ? "Claiming..." : "Claim Tokens"}
                    </button>
                    {errorMessage && (
                        <p className={styles.errorMessage}>{errorMessage}</p>
                    )}
                </>
            ) : (
                <p className={styles.message}>You have not been rewarded with tokens 😢</p>
            )}
        </div>
    );
};

export default TokenClaimSection;