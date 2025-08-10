import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TokensStakingPage from "./pages/tokens-staking-page/tokens-staking-page.tsx";
import TokenClaimPage from "./pages/token-claim-page/token-claim-page.tsx";
import MintNftPage from "./pages/mint-nft-page/mint-nft-page.tsx";

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/token-airdrop" element={<TokenClaimPage />} />
                <Route path="/nft-airdrop" element={<MintNftPage />} />
                <Route path="/" element={<TokensStakingPage />} />
            </Routes>
        </Router>
    );
};

export default App;