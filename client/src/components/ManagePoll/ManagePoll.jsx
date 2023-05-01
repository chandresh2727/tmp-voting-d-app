import "../CreatePoll/CreatePoll.css";
import { useEffect, useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import { getUrlVars, getRPCErrorMessage } from "../../Handlers/utils";
import { DisplayOptions } from "../DisplayOption/DisplayOption";
import Form from "react-bootstrap/Form";
import Toast from "react-bootstrap/Toast";
import {RiAddCircleLine} from 'react-icons/ri'
import Web3 from "web3";
import {
	textAreaIterator,
} from "../../Handlers/iteratorHandler";
import "./ManagePoll.css";
import {useNavigate} from 'react-router-dom'


import {VscError} from 'react-icons/vsc'
import { ShareButton } from "../ShareButton/ShareButton";

export const ManagePoll = () => {
	const web3 = new Web3(Web3.givenProvider || "ws://localhost:7545");
	const {
		state: { accounts, contract },
	} = useEth();
	const placeholerVal = "Loading...";
	const [addressListChanged, setAddressListChanged] = useState(false);
	const [rawAddressList, setRawAddressList] = useState("Loading...");
	const [statusType, setStatusType] = useState(0);
	const [showSuccessMsg, setShowSuccessMsg] = useState(false)
	const [poll, setPoll] = useState({
		fetched: false,
		data: {
			addressList: placeholerVal,
			hostId: placeholerVal,
			options: placeholerVal,
			pollDescription: placeholerVal,
			pollId: placeholerVal,
			pollName: placeholerVal,
			pollStatus: placeholerVal,
			pollType: placeholerVal,
			tokenAmount: placeholerVal,
			tokenContractAddress: placeholerVal,
			walletAddress: placeholerVal,
		},
	});
	const [pollTime, setPollTime] = useState({
		fetched: false,
		data: {
			customStartDate: false,
			customEndDate: false,
			pollStartDate: 0,
			pollEndDate: 0,
		},
	});
	const [showErr, setShowError] = useState(0)
	
	const navigate = useNavigate();
	useEffect(() => {
		let _pollId = getUrlVars()["pid"];
		if (!_pollId) {
			navigate('/?error=1&msg=provide a valid poll id')
		}
	}, [contract, accounts, navigate]);

	if(getUrlVars()['error'] && showErr === 0) {
		setShowError(1)
	}
	const handleCompile = (rawInput) => {
		let filteredAddress = Array.from(
			new Set(textAreaIterator(rawInput, (e) => e))
		);
		setPoll((prevState) => ({
			...prevState,
			data: {
				...prevState.data,
				addressList: filteredAddress,
			},
		}));
		setRawAddressList(filteredAddress.join(", "));
		setAddressListChanged(false);
	};

	useEffect(() => {
		const getPollDetails = async () => {
			return await contract?.methods
				.getPollDetails(getUrlVars()["pid"], Math.floor(Date.now()/1000))
				.call({ from: accounts[0] });
		};
		const getPollTimeDetails = async () => {
			return await contract?.methods
				.getPollTimeDetails(getUrlVars()["pid"])
				.call({ from: accounts[0] });
		};
		getPollDetails()
			.then((details) => {
				setRawAddressList(details.addressList.join(", "));
				setPoll({
					fetched: true,
					data: {
						addressList: details.addressList,
						hostId: details.hostId,
						options: details.options,
						pollDescription: details.pollDescription,
						pollId: details.pollId,
						pollName: details.pollName,
						pollStatus: details.pollStatus,
						pollType: details.pollType,
						tokenAmount: details.tokenAmount,
						tokenContractAddress: details.tokenContractAddress,
						walletAddress: details.walletAddress,
					},
				});
			})
			.catch((e) => {
				let commString =
					"VM Exception while processing transaction: revert ";
				if (e.toString().includes(commString)) {
					let emsg = getRPCErrorMessage(e);
					console.log("----ManagePoll.jsx----", emsg);
					navigate('/?error=1&msg=' + emsg)
					// window.location.href = "/?error=1&msg=" + emsg;
				} else {
					// alert("unknown error occured");
					console.log("managepolljsx ->getpolldetails().catch()");
					throw new Error(e);
				}
			});
		getPollTimeDetails()
			.then((details) => {
				setPollTime({
					fetched: true,
					data: {
						customStartDate: details.customStartDate,
						customEndDate: details.customEndDate,
						pollStartDate: details.pollStartDate,
						pollEndDate: details.pollEndDate,
					},
				});
			})
			.catch((e) => {
				let commString =
					"VM Exception while processing transaction: revert ";
				if (e.toString().includes(commString)) {
					let emsg = getRPCErrorMessage(e);
					console.log("----ManagePoll.jsx----", emsg);
					navigate('/?error=1&msg=' + emsg)
					// window.location.href = "/?error=1&msg=" + emsg;
				} else {
					console.log("managepolljsx ->getPollTimeDetails().catch()");
					// alert("unknown error occured");
					throw new Error(e);
				}
			});
	}, [contract, accounts, poll.fetched,navigate]);

	const pollTypeEnum = {
		0: "PUBLIC",
		1: "PRIVATE",
		2: "METERED",
	};

	const pollStatusEnum = {
		0: "DRAFT",
		1: "LIVE",
		2: "CONDUCTED",
		3: "DISCARDED",
	};
	const displayErrMsg = () => {
		setShowError(1)
		setTimeout(()=>setShowError(0),5000)
	}

	useEffect(() => {

		const changeStatus = async (ind) => {
			let hash = web3.utils.sha3(JSON.stringify(ind));
			setStatusType(0);
			let signature = await web3.eth.personal
				.sign(hash, accounts[0])
				.catch((e) => {
					console.log(e);
				});
			let r = signature.slice(0, 66);
			let s = "0x" + signature.slice(66, 130);
			let v = parseInt(signature.slice(130, 132), 16);
			let value = await contract.methods
				.updatePollStatus(
					poll.data.pollId,
					ind,
					hash,
					signature,
					r,
					s,
					v
				)
				.send({ from: accounts[0] })
				.catch((e) => {
					console.log(e);
					alert("user cancelled the status change", "hh");
				});
			let a = await value.events["evUpdatePollStatus"].returnValues[
				"successfull"
			];
			if (a) {
				setPoll({...poll, fetched: false})
			} else {
				alert("something went wrong!");
			}
		};
		if ([1, 3].includes(statusType)) changeStatus(statusType);
	}, [statusType, setStatusType, accounts, poll, contract, web3]);
	const saveChanges = async (e) => {
		e.preventDefault();
		if (addressListChanged) {
			return alert("please compile addressess");
		}
		if (poll.data.addressList.length === 0) {
			return alert("please add atleast 1 address");
		}
		
		let hash = web3.utils.sha3(JSON.stringify(poll.data));
		let signature = await web3.eth.personal
			.sign(hash, accounts[0])
			.catch((e) => {
				console.log(e);
			});
		let r = signature.slice(0, 66);
		let s = "0x" + signature.slice(66, 130);
		let v = parseInt(signature.slice(130, 132), 16);
		let value = await contract.methods
			.updatePoll(poll.data, hash, signature, r, s, v)
			.send({ from: accounts[0] })
			.catch((e) => {
				console.log(e);
				alert("user cancelled the request", "hh");
			});

		let a = await value.events["evUpdatePoll"].returnValues["successfull"];

		if (a) {
			setShowSuccessMsg(true)
			setTimeout(() => {
				setShowSuccessMsg(false)
			}, 7000);
			setPoll({ ...poll, fetched: false });

			// window.location.reload();
		} else {
			alert("something went wrong!");
		}
	};

	const prepareGoLIVE = async() => {
		if (!contract && !contract.methods) return;
		let value = await contract?.methods
			.fetchPollOptions(getUrlVars()['pid'])
			.call({ from: accounts[0] })
			.then((d) => d)
			.catch((e) => {
				let commString =
					"VM Exception while processing transaction: revert ";
				if (e.toString().includes(commString)) {
					let emsg = getRPCErrorMessage(e);
					console.log("----ManagePoll.jsx----", emsg);
					navigate('/?error=1&msg=' + emsg)
					// window.location.href = "/?error=1&msg=" + emsg;
				} else {
					alert("unknown error occured");
					throw new Error(e);
				}
			});
		// if )
		if (value.length < 2) {
			displayErrMsg()
			navigate(`?pid=${getUrlVars()['pid']}&error=1&msg="Add Atleast 2 options before going live"`)
		} else setStatusType(1);
	}



	return (
		<div className="artificialContainer">
			<div className={showErr ? "fadeOut": 'hide'}>
				{getUrlVars()["error"] ? (
				<Toast style={{background: "#ffb7b7", color: "black", border: "1.5px solid #d67c7c", width: "fit-content"}}
				class="lg-toast"
				// bg={"danger"}
				autohide={true}
				delay={5000}>
			
				<Toast.Body className="text-red" style={{fontSize: "2rem", fontFamily: "'Lexend', sans-serif", textTransform: "uppercase", display: "flex", justifyContent: "center" }}>
					<VscError/>&nbsp;&nbsp;
					{decodeURIComponent(getUrlVars()["msg"])}
				</Toast.Body>
			</Toast>
				) : (
					""
				)}
			</div>

			<div className="fadeOut">
				{getUrlVars()["success"] ? (
					<Toast  style={{background: "#ffb7b7", color: "black", border: "1.5px solid limegreen"}}
						className="lg-toast"
						bg={"success"}
						autohide={true}
						delay={5000}>
						<Toast.Body className="text-white" style={{fontSize: "2rem", fontFamily: "'Lexend', sans-serif", textTransform: "uppercase", display: "flex", justifyContent: "center" }}>
							{decodeURIComponent(getUrlVars()["msg"])}
						</Toast.Body>
					</Toast>
				) : (
					""
				)}
			</div>
			<div className={showSuccessMsg ? 'fadeOut' : 'hide'}>
			{showSuccessMsg ? (
					<Toast  style={{background: "#ffb7b7", color: "black", border: "1.5px solid limegreen"}}
						className="lg-toast"
						bg={"success"}
						autohide={true}
						delay={5000}>
						<Toast.Body className="text-white" style={{fontSize: "2rem", fontFamily: "'Lexend', sans-serif", textTransform: "uppercase", display: "flex", justifyContent: "center" }}>
							"Poll Updated Successfully"
						</Toast.Body>
					</Toast>
				) : (
					""
				)}
			</div>
			{/* <button onClick={()=>navigate('/results')}>load results</button> */}
			<Form style={(poll.data.pollStatus === "1") ? {"border":"1.5px solid #00ffad","boxShadow":"#006e53 1px 1px 74px 14px"}: {}}>
			{poll.data.pollStatus === "1" ? <span className="status live">live</span> : (poll.data.pollStatus=== "0" ?  <span className="status draft">draft</span> :  <span className="status conducted">conducted</span> )}
				<Form.Group className="mb-3" controlId="pollName">
					<Form.Label>Poll Name&nbsp;&nbsp;<ShareButton pollName={poll.data.pollName} pollDescription={poll.data.pollDescription}/></Form.Label>
					<Form.Control
					autoComplete="pollName"
						type="text"
						name="pollName"
						placeholder="poll name"
						value={poll.data.pollName}
						onChange={(e) => {
							setPoll((prevState) => ({
								...prevState,
								data: {
									...prevState.data,
									pollName: e.target.value,
								},
							}));
						}}
					/>
				</Form.Group>
				<div className="immutable">
					<span className="immutableItem">
						Poll Type:{" "}
						<span className="PrefixVal">
							{pollTypeEnum[poll.data.pollType]}
						</span>
					</span>
					&nbsp;&nbsp;&nbsp;
					<span className="immutableItem">
						Poll Status:{" "}
						<span className="PrefixVal">
							{pollStatusEnum[poll.data.pollStatus]}
						</span>
					</span>
					&nbsp;&nbsp;&nbsp;
					<span className="immutableItem">
						Starting Date:{" "}
						<span className="PrefixVal">
							{pollTime.data.customStartDate
								? new Date(
										parseInt(pollTime.data.pollStartDate)
								  ).toLocaleString()
								: "Immediately After Going Live	"}
						</span>
					</span>
					&nbsp;&nbsp;&nbsp;
					<span className="immutableItem">
						Ending Date:{" "}
						<span className="PrefixVal">
							{pollTime.data.customEndDate
								? new Date(
										parseInt(pollTime.data.pollEndDate)
								  ).toLocaleString()
								: "Never"}
						</span>
					</span>
				</div>
				<Form.Group className="mb-3" controlId="pollDescription">
					<Form.Label>Poll Description</Form.Label>
					<Form.Control
					autoComplete="nofill"
						as="textarea"
						name="pollDescription"
						rows={3}
						placeholder="poll description"
						value={poll.data.pollDescription}
						onChange={(e) => {
							setPoll((prevState) => ({
								...prevState,
								data: {
									...prevState.data,
									pollDescription: e.target.value,
								},
							}));
						}}
					/>
				</Form.Group>
				{parseInt(poll.data.pollType) > 0 ? (
					<Form.Group className="mb-3" controlId="addressList">
						<Form.Label
							style={{ display: "flex", alignItems: "center" }}>
							List of addresses&nbsp;&nbsp;{" "}
							<span
								className="sm fakeBtn"
								style={
									addressListChanged
										? { backgroundColor: "red" }
										: { backgroundColor: "green" }
								}
								onClick={(e) =>
									addressListChanged
										? handleCompile(rawAddressList)
										: ""
								}>
								Compile Addresses
							</span>
						</Form.Label>
						<Form.Control
					autoComplete="nofill"
							name="addressList"
							as="textarea"
							rows={3}
							placeholder="0xabcd, 0x1234, 0xa2b1"
							value={rawAddressList}
							onChange={(e) => {
								setAddressListChanged(true);
								setRawAddressList(e.target.value);
							}}
						/>
					</Form.Group>
				) : (
					""
				)}
				{poll.data.pollType === "2" ? (
					<>
						<Form.Group className="mb-3" controlId="tokenAddress">
							<Form.Label>Token Address</Form.Label>
							<Form.Control
					autoComplete="nofill"
								name="tokenAddress"
								pattern="0x[a-fA-F0-9]{40}$"
								title="Please enter valid address"
								type="text"
								placeholder="0xabcd"
								value={poll.data.tokenContractAddress}
								onChange={(e) => {
									setPoll((prevState) => ({
										...prevState,
										data: {
											...prevState.data,
											tokenContractAddress:
												e.target.value,
										},
									}));
								}}
							/>
						</Form.Group>

						<Form.Group className="mb-3" controlId="tokenAmount">
							<Form.Label>Token Amount</Form.Label>
							<Form.Control
					autoComplete="nofill"
								name="tokenAmount"
								type="number"
								min={1}
								// step="0.000000001"
								pattern="^(([0-9]*)|(([0-9]*)\.([0-9]*)))$"
								// max={9999999}
								placeholder="i.e 0.43"
								value={poll.data.tokenAmount}
								onChange={(e) => {
									setPoll((prevState) => ({
										...prevState,
										data: {
											...prevState.data,
											tokenAmount: e.target.value,
										},
									}));
								}}
							/>
						</Form.Group>
					</>
				) : (
					""
				)}

				<Form.Group className="mb-3" controlId="pollStatus">
					<Form.Label><span className="d-flex align-items-center"><span>Poll Options: &nbsp;&nbsp;</span> {["0","1"].includes(poll.data.pollStatus) ? <span><button className="btn btn-secondary managePollBtn"
							onClick={() =>
								navigate(
									"/manage/option/add?pid=" + getUrlVars()["pid"]
								)
							}>
							 <RiAddCircleLine  color="white" /> {"Create a new option".toUpperCase()}
						</button></span> : <span style={{color: "dimgrey"}}>{"You Cannot Add Options Once The Poll Has Ended".toUpperCase()}</span>}</span></Form.Label>
					<DisplayOptions pstatus={poll.data.pollStatus}/>
				</Form.Group>

				<Form.Group className="mb-3" controlId="pollStatus">
					<Form.Label>Poll Actions: &nbsp;&nbsp;</Form.Label>
					<div className="row">
						<div className="col-sm">
							<button
								className="btn btn-outline-danger managePollBtn"
								onClick={(e) => {
									e.preventDefault();
									setStatusType(3);
								}}>
								DISCARD POLL
							</button>
						</div>{" "}
						{((poll.data.pollStatus === "0" )&& !pollTime.data.customStartDate) ? (
							<div className="col-sm">
								<button
									className="btn btn-success managePollBtn"
									onClick={(e) => {
										e.preventDefault();
										prepareGoLIVE()
									}}>
									GO LIVE
								</button>
							</div>
						) : (
							""
						)}
					</div>
				</Form.Group>
{["0","1"].includes(poll.data.pollStatus) ? 
				<Form.Group className="mb-3" controlId="pollSave">
					<button
						className="btn btn-primary managePollBtn"
						onClick={saveChanges}>
						{"Save Changes".toUpperCase()}
					</button>
				</Form.Group> : ''}
				{/* */}
			</Form>

			{/* <DisplayOptions /> */}
		</div>
	);
};
