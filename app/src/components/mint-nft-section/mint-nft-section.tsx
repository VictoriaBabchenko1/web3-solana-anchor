import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import styles from "./mint-nft-section.module.scss";
import { useMintNft } from "../../hooks/nft-airdrop/use-mint-nft";

const MintNftSection: React.FC = () => {
    const { publicKey } = useWallet();
    const { hasMinted, claimNft } = useMintNft();
    const [loading, setLoading] = useState(false);
    const [minted, setMinted] = useState(false);
    const [checkingMintStatus, setCheckingMintStatus] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [alreadyMintedStatus, setAlreadyMintedStatus] = useState(false);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);

    useEffect(() => {
        const checkMintStatus = async () => {
            try {
                setCheckingMintStatus(true);
                const alreadyMinted = await hasMinted();
                setAlreadyMintedStatus(alreadyMinted);
            } catch (error) {
                console.error("Error checking mint status:", error);
            } finally {
                setCheckingMintStatus(false);
            }
        };

        checkMintStatus().catch(console.error);
    }, [publicKey, hasMinted]);

    // Use for minting immediately to the user's wallet address
    // const handleMintNft = async () => {
    //     try {
    //         setLoading(true);
    //         setErrorMessage(null);
    //         await mintNft();
    //         setMinted(true);
    //     } catch (err) {
    //         console.log("Error: " + err);
    //         setErrorMessage("Failed to mint NFT. Please try again.");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleClaimNft = async () => {
        try {
            setLoading(true);
            setErrorMessage(null);
            setInfoMessage(null);
            await claimNft();
            setMinted(true);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("No available NFTs")) {
                setInfoMessage("Unfortunately, all NFTs have already been issued 😢");
            } else {
                setErrorMessage("Failed to claim NFT. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!publicKey || checkingMintStatus) return null;

    return (
        <div className={styles.mintNftContainer}>
            {minted ? (
                <p className={styles.message}>✅ NFT successfully minted! 🎉</p>
            ) : alreadyMintedStatus ? (
                <p className={styles.message}>✅ You have already been rewarded with NFT</p>
            ) : (
                <>
                    <button
                        onClick={handleClaimNft}
                        disabled={loading}
                        className={styles.mintNftButton}
                    >
                        {loading ? "Minting..." : "Mint NFT"}
                    </button>
                    {errorMessage && (
                        <p className={styles.errorMessage}>{errorMessage}</p>
                    )}
                    {infoMessage && (
                        <p className={styles.message}>{infoMessage}</p>
                    )}
                </>
            )}
        </div>
    );
};

export default MintNftSection;