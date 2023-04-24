import { useEffect, useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import {
	getUrlVars,
	getRPCErrorMessage,
	num2alpha,
} from "../../Handlers/utils";
import { useNavigate } from "react-router-dom";

import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import Button from "react-bootstrap/Button";
import Toast from "react-bootstrap/Toast";
import {VscError} from 'react-icons/vsc'
import Form from "react-bootstrap/Form";
import Web3 from "web3";
import "./Vote.css";

export const Vote = () => {
	const {
		state: { accounts, contract },
	} = useEth();
	const [showErr, setShowError] = useState(0)
	const [selected, setSelected] = useState({class: "", option: {}})
	const navigate = useNavigate();
	const [options, setOptions] = useState({
		fetched: false,
		data: [
			{
				optionId: "loading",
				optionName: "loading",
				pollId: "loading",
				optionDescription: "",
			},
		],
	});

	const [poll, setPoll] = useState({
		fetched: false,
		data: {},
	});
	const web3 = new Web3(Web3.givenProvider || "ws://localhost:7545");
	// const [result, setResult] = useState({
	//     fetched: false,
	//     data: {

	//     }
	// })

	useEffect(() => {
		const checkPollIdForVoter = async () =>
			await contract?.methods
				.getPollDetailsForVoting(
					getUrlVars()["pid"],
					Math.floor(Date.now() / 1000)
				)
				.call({ from: accounts[0] });

		const fetchPollOptions = async () =>
			await contract?.methods
				.fetchPollOptions(getUrlVars()["pid"])
				.call({ from: accounts[0] });

		checkPollIdForVoter()
			.then((datar) => {
				setPoll((prevState) => ({
					...prevState,
					fetched: true,
					data: {
						...datar,
					},
				}));
				console.log("    CQNRLQ32 48FCWG", datar);
			})
			.catch((e) => {
				console.log(e);
				let commString =
					"VM Exception while processing transaction: revert ";
				if (e.toString().includes(commString)) {
					let emsg = getRPCErrorMessage(e);
					console.log("----ManagePoll.jsx----", emsg);
					navigate("/?error=1&msg=" + emsg);
					// window.location.href = "/?error=1&msg=" + emsg;
				} else {
					console.log(
						"error found at Vote.jsx, checkPollIdForVoter().catch"
					);
					throw new Error(e);
				}
			});

		fetchPollOptions()
			.then((datar) => {
				// datar.forEach((v) => {
				// 	setPopovers((prevState) => {
				// 		prevState[v.optionId] = })
				// })
				setOptions((prevState) => ({
					...prevState,
					fetched: true,
					data: datar,
				}));
			})
			.catch((e) => {
				console.log(e);
				let commString =
					"VM Exception while processing transaction: revert ";
				if (e.toString().includes(commString)) {
					let emsg = getRPCErrorMessage(e);
					console.log("----ManagePoll.jsx----", emsg);
					navigate("/?error=1&msg=" + emsg);
					// window.location.href = "/?error=1&msg=" + emsg;
				} else {
					console.log(
						"error found at Vote.jsx, fetchPollOptions().catch"
					);
					throw new Error(e);
				}
			});
	}, [accounts, contract, navigate]);

	const displayErrMsg = () => {
		setShowError(1)
		setTimeout(()=>setShowError(0),5000)
	}

	const handleSubmitVote = async (e) => {
		e.preventDefault();
		document.getElementById("submitBtnForVote").disabled = true;
		if(selected.class=== "") {
			document.getElementById("submitBtnForVote").disabled = false;
			displayErrMsg()
			return navigate(`${window.location.pathname}?error=true&msg=please choose an option first&pid=${getUrlVars()['pid']}`)
		}
		
			let hash = web3.utils.sha3(JSON.stringify({pid: getUrlVars()['pid'], oid: options.data.optionId}));
		let signature = await web3.eth.personal
			.sign(hash, accounts[0])
			.catch((e) => {
				console.log(e);
			});
		// alert("before rsv")
		let r = signature.slice(0, 66);
		let s = "0x" + signature.slice(66, 130);
		let v = parseInt(signature.slice(130, 132), 16);
		// alert(r,s,v)
		// alert(getUrlVars()['pid'] + selected.option.optionId)
		// console.log(getUrlVars()['pid'], selected.option.optionId)
		let value = await contract.methods.castVote(
				getUrlVars()['pid'],
				selected.option.optionId,
				hash,
				r,
				s,
				v
			)
			.send({ from: accounts[0] })
			.catch((e) => {
				console.log(e);
				// alert("user cancelled the vote", "hh");
				let commString =
				"VM Exception while processing transaction: revert ";
				let emsg = e.message.split(commString)[1].split("\",")[0];
				console.log("----ManagePoll.jsx----", emsg);
				navigate('/?error=1&msg=' + emsg)
			// if (e.toString().includes(commString)) {
				
			// 	// window.location.href = "/?error=1&msg=" + emsg;
			// } else {
			// 	console.log("managepolljsx ->getPollTimeDetails().catch()");
			// 	// alert("unknown error occured");
			// 	throw new Error(e);
			// }
			});
		alert("hi")
		console.log(await value);
		let a = await value.events["evCastVote"].returnValues[
			"wasSuccessful"
		];
		// console.log(a, "a is at vote.jsx")
		// if (a) {
		// 	alert(a)
		// 	// setPoll({...poll, fetched: false})
		// } else {
		// 	alert("something went wrong!");
		// }

		document.getElementById("submitBtnForVote").disabled = false;
		
	};

	const handleSelectOption = (event, optionDetails) => {
		event.preventDefault()
		console.error(optionDetails, "999999999999999999999999")
	}
	return (
		<>			<div className={showErr ? "fadeOut": 'hide'} style={{width: "inherit"}}>
		{getUrlVars()["error"] ? (
		<Toast style={{background: "#ffb7b7", color: "black", border: "1.5px solid #d67c7c", width: "fit-content"}}
		className="lg-toast"
		// bg={"danger"}
		autohide={true}
		delay={5000}>
	
		<Toast.Body className="text-red" style={{fontSize: "2rem",width: "max-content", fontFamily: "'Lexend', sans-serif", textTransform: "uppercase", display: "flex", justifyContent: "center" }}>
			<VscError/>&nbsp;&nbsp;
			{decodeURIComponent(getUrlVars()["msg"])}
		</Toast.Body>
	</Toast>
		) : (
			""
		)}
	</div><div className="wrapper">

			<header>{poll.fetched ? poll.data.pollName : "loading.."}</header>
			<p>{poll.fetched ? poll.data.pollDescription : "loading.."}</p>
			<div classnam="poll-area">
				{console.log("wsefwaegg")}
				{!options.fetched ? (
					<>
						<span className="card is-loading">
							<h2></h2>
							<h2></h2>
							<h2></h2>
							<h2></h2>
						</span>
					</>
				) : (
					<Form
						style={{ boxShadow: "initial", padding: "0" }}
						onSubmit={(e) => handleSubmitVote(e)}>
						{options?.data?.map((v, i) => (
							<div key={`opt-${i + 1}`} className={selected.class === `opt-${i+1}` ? 'option chosen' : 'option'} onClick={(e) => setSelected((prevState) => ({
								...prevState,
								class:  `opt-${i+1}`,
								option: {
									...prevState.option,
									...v
								}
							}))} title={v.optionDescription.trim() !== "" ? v.optionDescription : v.optionName}>
								<span className="option-title">
									<span style={{ width: "10%" }}>
										&nbsp;{num2alpha(i + 1)}.
									</span>
									{v.optionName}
								</span>
							</div>
						))}{" "}
						<button
							id="submitBtnForVote"
							className="btn btn-success w-100 text-uppercase text-large managePollBtn">
							Sign & Vote
						</button>
					</Form>
				)}
			</div>
		</div></>
		
	);
};

// poll exists
// poll has started ????
// poll has ended ????
// if poll type is not public then check if msg.sender is in addressList
