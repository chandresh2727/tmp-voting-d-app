import { useState, useEffect } from "react";
import "../CreatePoll/CreatePoll.css";
// import Web3 from "web3";
import useEth from "../../contexts/EthContext/useEth";
import "./Navbar.css";
import { useLocation, useNavigate} from "react-router-dom"
// import { useRoute } from '@react-navigation/native';
import moment from "moment-timezone";


export const Navbar = () => {
	const navigate = useNavigate()
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
		fetchUserDetails().then((details) => {
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

	return (
		<div className="Navbar">
			<center>
				<div className="app-logo" onClick={()=>navigate("/")}>
				SmartVote
				</div>
				<span className="value" style={{color: "white"}}>
  {currentTime}
				</span>


				<button className="glow-on-hover" type="button"><span className="artdot" style={accounts ? {backgroundColor: "green"} : {backgroundColor: "red"}}></span><span>&nbsp;</span><span>{accounts ? `${accounts[0]?.slice(0,6)}..${accounts[0]?.slice(-3)}` : '0x0000..000'}</span></button>

			</center>
		</div>
	);
};
