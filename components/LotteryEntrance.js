import { useWeb3Contract } from "react-moralis";
import { abi, contractAddresses } from "../constants";
import { useMoralis } from "react-moralis";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useNotification } from "web3uikit";
import { Bell } from "@web3uikit/icons";

export default function LotteryEntrance() {
    const { chainId: chainIdHex, isWeb3Enabled, web3 } = useMoralis();
    const chainId = parseInt(chainIdHex);
    const lotteryAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null;
    const [enteranceFee, setEnteranceFee] = useState("0");
    const [numPlayers, setNumPlayers] = useState("0");
    const [recentWinner, setRecentWinner] = useState("0");
    const dispatch = useNotification();

    const {
        runContractFunction: enterLottery,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "enterLottery",
        params: {},
        msgValue: enteranceFee,
    });

    const { runContractFunction: getEnteranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "getEntranceFee",
        params: {},
    });

    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "getNumberOfPlayers",
        params: {},
    });

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "getRecentWinner",
        params: {},
    });

    async function updateUi() {
        const enteranceFeeCall = (await getEnteranceFee()).toString();
        const numPlayersFromCall = (await getNumberOfPlayers()).toString();
        const recentWinnerFromCall = (await getRecentWinner()).toString();
        setEnteranceFee(enteranceFeeCall);
        setNumPlayers(numPlayersFromCall);
        setRecentWinner(recentWinnerFromCall);
        console.log(enteranceFeeCall);
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            if (lotteryAddress != null) {
                updateUi();
            }
        }
    }, [isWeb3Enabled]);

    useEffect(() => {
        if (isWeb3Enabled) {
            if (lotteryAddress != null) {
                const contract = new ethers.Contract(lotteryAddress, abi, web3);

                contract.on("WinnerPicked", (winner) => {
                    setRecentWinner(winner);
                });
            }
        }
    }, [isWeb3Enabled]);

    const handleSuccess = async function (tx) {
        await tx.wait(1);
        handleNewNotification(tx);
        updateUi();
    };

    const handleNewNotification = async function (tx) {
        dispatch({
            type: "info",
            message: `Transaction Complete hash:${tx.hash}`,
            title: "Tx Notification",
            position: "topR",
            icon: <Bell></Bell>,
        });
    };

    return (
        <div className="p-5">
            {lotteryAddress ? (
                <div>
                    <button
                        className="bg-blue-400 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto "
                        onClick={async function () {
                            await enterLottery({
                                onSuccess: handleSuccess,
                                onError: (error) => console.log(error),
                            });
                        }}
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            <div>Enter Lottery</div>
                        )}
                    </button>
                    <div>
                        {" "}
                        Enterance Fee : {ethers.utils.formatUnits(enteranceFee, "ether")} ETH
                    </div>
                    <div>Number Of Players: {numPlayers}</div>
                    <div> Recent Winner: {recentWinner} </div>
                </div>
            ) : (
                <div>No Lottery detected change network to gorelli</div>
            )}
        </div>
    );
}
