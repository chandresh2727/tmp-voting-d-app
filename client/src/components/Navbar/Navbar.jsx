import { useState, useEffect } from "react";
import "../CreatePoll/CreatePoll.css";
// import Web3 from "web3";
import useEth from "../../contexts/EthContext/useEth";
import "./Navbar.css";
import { useLocation} from "react-router-dom"
// import { useRoute } from '@react-navigation/native';


export const Navbar = () => {
	const {
		state: { accounts, contract },
	} = useEth();
	const [hostid, setHostid] = useState("hstxxxxxxxxxxxxx");
	const [voterid, setVoterid] = useState("vtrxxxxxxxxxxxxx");
	let location = 	useLocation();


	useEffect(() => {
		const fetchUserDetails = async () => {
			return await contract?.methods.getUserDetails().call({ from: accounts[0] });
		};
		fetchUserDetails().then((details) => {
			console.log(details)
			details = details[0]
			if (details.walletAddress === "0x0000000000000000000000000000000000000000") {
				setHostid("hstxxxxxxxxxxxxx")
				setVoterid("vtrxxxxxxxxxxxxx")
			} else {
				setHostid(details.hostId)
				setVoterid(details.voterId)
			}
		})
	}, [accounts, contract, location]);
	// console.log(ab().then((d) => console.log(d)))

	return (
		<div className="Navbar">
			<center>
				<span>
					Current Accoount: <b className="monospace"> {accounts} </b>
				</span>
				<span>
					&nbsp;&nbsp;Host Id: <b className="monospace"> {hostid} </b>
				</span>
				<span>
					&nbsp;&nbsp;Voter Id:{" "}
					<b className="monospace"> {voterid} </b>
				</span>
			</center>
		</div>
	);
};
