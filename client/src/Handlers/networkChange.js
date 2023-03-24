import Web3 from "web3";

export const checkNewtork = async () => {
    let testnet = false
    let chainId = testnet ? 11155111 : 5777; // ganache
    if (window.ethereum.networkVersion !== chainId) {
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: Web3.utils.toHex(chainId) }],
            });
        } catch (err) {
            // This error code indicates that the chain has not been added to MetaMask
            if (err.code === 4902) {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [
                        {
                            chainName: "Ganache Testnet",
                            chainId: Web3.utils.toHex(chainId),
                            nativeCurrency: {
                                name: "ETH",
                                decimals: 18,
                                symbol: "ETH",
                            },
                            rpcUrls: ["HTTP://127.0.0.1:7545"],
                        },
                    ],
                });
            }
        }
    }
};