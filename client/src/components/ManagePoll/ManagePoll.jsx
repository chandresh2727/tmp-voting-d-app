import "../CreatePoll/CreatePoll.css";
import { useEffect, useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import { getUrlVars, getRPCErrorMessage } from "../../Handlers/utils";
import { DisplayOptions } from "../DisplayOption/DisplayOption";
import Form from "react-bootstrap/Form";
import Web3 from "web3";
import {
	textAreaIterator,
	excelIterator,
	jsonIterator,
} from "../../Handlers/iteratorHandler";
import { AddOption } from "../AddOption/AddOption";
import "./ManagePoll.css";
import { useNavigate } from "react-router-dom";

export const ManagePoll = () => {
	const web3 = new Web3(Web3.givenProvider || "ws://localhost:7545");
	const {
		state: { accounts, contract },
	} = useEth();
	const placeholerVal = "Loading...";
	const [addressListChanged, setAddressListChanged] = useState(false);
	const [rawAddressList, setRawAddressList] = useState("Loading");
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

	const navigate = useNavigate();
	useEffect(() => {
		let _pollId = getUrlVars()["pid"];
		if (!_pollId) {
			window.location.href = "/?error=1&msg=provide a valid poll id";
		}
		contract?.methods
			.fetchPollOptions(_pollId)
			.call({ from: accounts[0] })
			.then((d) => console.log(d))
			.catch((e) => {
				let commString =
					"VM Exception while processing transaction: revert ";
				if (e.toString().includes(commString)) {
					let emsg = getRPCErrorMessage(e);
					console.log("----ManagePoll.jsx----", emsg);
					window.location.href = "/?error=1&msg=" + emsg;
				} else {
					alert("unknown error occured");
					throw new Error(e);
				}
			});

		console.log("hi");
	}, [contract, accounts]);

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
				.getPollDetails(getUrlVars()["pid"])
				.call({ from: accounts[0] });
		};
		const getPollTimeDetails = async () => {
			return await contract?.methods
				.getPollTimeDetails(getUrlVars()["pid"])
				.call({ from: accounts[0] });
		};
		getPollDetails().then((details) => {
			console.log(details);
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
		});
		getPollTimeDetails().then((details) => {
			console.log("details", details);
			setPollTime({
				fetched: true,
				data: {
					customStartDate: details.customStartDate,
					customEndDate: details.customEndDate,
					pollStartDate: details.pollStartDate,
					pollEndDate: details.pollEndDate,
				},
			});
		});
	}, [contract, accounts]);

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

	const saveChanges = async (e) => {
		e.preventDefault();
		if (addressListChanged) {
			return alert("please compile addressess");
		}
		if (poll.data.addressList.length === 0) {
			return alert("please add at least 1 address");
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
				.updatePoll(poll.data, 	hash,
					signature,
					r,
					s,
					v)
				.send({ from: accounts[0] })
				.catch((e) => {
					console.log(e)
					alert("user cancelled the request", "hh");
				});
		let a = await value.events["evUpdatePoll"].returnValues["successfull"];
		if(a) {
			window.location.reload()
		} else {
			alert("something went wrong!")
		}
	};

	return (
		<div className="artificialContainer">
			<Form>
				<Form.Group className="mb-3" controlId="pollName">
					<Form.Label>Poll Name</Form.Label>
					<Form.Control
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
							{console.log(pollTime.data.pollStartDate)}
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
					<Form.Label>Poll Actions: &nbsp;&nbsp;</Form.Label>
					<button className="btn btn-outline-danger managePollBtn">
						DISCARD POLL
					</button>{" "}
					<button className="btn btn-primary managePollBtn">
						GO LIVE
					</button>
				</Form.Group>

				<Form.Group className="mb-3" controlId="pollSave">
					<button
						className="btn btn-success managePollBtn"
						onClick={saveChanges}>
						Save Changes
					</button>
				</Form.Group>
				{/* */}
			</Form>

			<DisplayOptions />
			<button
				onClick={() =>
					navigate("/manage/option/add?pid=" + poll.data.pollId)
				}>
				Add Options
			</button>
		</div>
	);
};
