import { useState, useEffect } from "react";
import "../CreatePoll/CreatePoll.css";
// import Web3 from "web3";
import useEth from "../../contexts/EthContext/useEth";
import "./Navbar.css";
import { useLocation} from "react-router-dom"
// import { useRoute } from '@react-navigation/native';
import moment from "moment-timezone";


export const Navbar = () => {
	const {
		state: { accounts, contract },
	} = useEth();
	const [hostid, setHostid] = useState("hstxxxxxxxxxxxxx");
	const [voterid, setVoterid] = useState("vtrxxxxxxxxxxxxx");
	const [currentTime, setCurrentTime] = useState("")
	let location = 	useLocation();
	const getCurrentTime = () => {
		return `${new Date().toLocaleString()} ${moment.tz(moment.tz.guess()).zoneAbbr()}`
	}

	useEffect(()=>{
		setInterval(() => setCurrentTime(getCurrentTime()),1000)
	},[])

	useEffect(() => {
		const fetchUserDetails = async () => {
			return await contract?.methods.getUserDetails().call({ from: accounts[0] });
		};
		console.log(accounts)
		console.log('contract!!!!!!!!!!!!!!!!', contract?.methods)
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
				</span><br />
				<span style={{color: "white", backgroundColor: "black", padding: "0.3% 0.5%", borderRadius: "5px", }}>
  {currentTime}
				</span>
			</center>
		</div>
	);
};
