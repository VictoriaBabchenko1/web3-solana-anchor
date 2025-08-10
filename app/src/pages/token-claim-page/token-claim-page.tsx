import React from "react";
import TokenClaimSection from "../../components/token-claim-section/token-claim-section.tsx";
import ConnectWalletButton from "../../components/connect-wallet-button/connect-wallet-button";
import styles from "./token-claim-page.module.scss";

const TokenClaimPage: React.FC = () => {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Claim Tokens</h1>
            <ConnectWalletButton />
            <TokenClaimSection />
        </div>
    );
};

export default TokenClaimPage;