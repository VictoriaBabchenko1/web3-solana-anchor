import React from "react";
import ConnectWalletButton from "../../components/connect-wallet-button/connect-wallet-button";
import styles from "./mint-nft-page.module.scss";
import MintNftSection from "../../components/mint-nft-section/mint-nft-section";

const MintNftPage: React.FC = () => {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Let`s Mint NFT</h1>
            <ConnectWalletButton />
            <MintNftSection />
        </div>
    );
};

export default MintNftPage;