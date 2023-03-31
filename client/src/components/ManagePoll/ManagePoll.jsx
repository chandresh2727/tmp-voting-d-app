import "../CreatePoll/CreatePoll.css";
import { useEffect, useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import { getUrlVars, getRPCErrorMessage } from "../../Handlers/utils";
import { DisplayOptions } from "../DisplayOption/DisplayOption";
import Form from "react-bootstrap/Form";
import { AddOption } from "../AddOption/AddOption";
import './ManagePoll.css'
import { useNavigate } from "react-router-dom";

export const ManagePoll = () => {
	const {
		state: { accounts, contract },
	} = useEth();
	const [poll, setPoll] = useState({
		fetched: false,
		data: {}
	})
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
					alert(emsg);
					window.location.href = "/?error=1&msg=" + emsg;
				} else {
					alert("unknown error occured");
					throw new Error(e);
				}
			});
		
		console.log("hi");
	}, [contract, accounts]);


	useEffect(() => {
		const getPollDetails = async () => {
			return await contract?.methods.getPollDetails(getUrlVars()["pid"]).call({ from: accounts[0] });
		};
		getPollDetails().then((details) => {
			console.log(details)
			setPoll({ fetched: true, data: details })
		})

	}, [contract, accounts])

	const placeholerVal = "Loading"
	let _poll = {
		addressList: poll?.data?.addressList || placeholerVal,
		hostId: poll?.data?.hostId || placeholerVal,
		options: poll?.data?.options || placeholerVal,
		pollDescription: poll?.data?.pollDescription || placeholerVal,
		pollId: poll?.data?.pollId || placeholerVal,
		pollName: poll?.data?.pollName || placeholerVal,
		pollStatus: poll?.data?.pollStatus || placeholerVal,
		pollType: poll?.data?.pollType || placeholerVal,
		tokenAmount: poll?.data?.tokenAmount || placeholerVal,
		tokenContractAddress: poll?.data?.tokenContractAddress || placeholerVal,
		walletAddress: poll?.data?.walletAddress || placeholerVal
	}

	const pollTypeEnum = {
		0: 'PUBLIC',
		1: 'PRIVATE',
		2: 'METERED'
	}

	const pollStatusEnum = {
		0: 'DRAFT',
		1: 'LIVE',
		2: 'CONDUCTED',
		3: 'DISCARDED'
	}

	const saveChanges = () => {		
	}

	console.log(poll)

	return (
		<div className="artificialContainer">
			<form>
			<Form.Group className="mb-3" controlId="pollName">
					<Form.Label>Poll Name</Form.Label>
					<Form.Control
						type="text"
						name="pollName"
						placeholder="poll name"
						value={_poll.pollName}
          onChange={(e) => {_poll.pollName = e.target.value}}
					/>
				</Form.Group> 
				<div className="immutable">
					<span className="immutableItem">Poll Type: <span className="PrefixVal">{pollTypeEnum[_poll.pollType]}</span></span>&nbsp;&nbsp;&nbsp;
					<span className="immutableItem">Poll Status: <span className="PrefixVal">{pollStatusEnum[_poll.pollStatus]}</span></span>
				</div>
				<Form.Group className="mb-3" controlId="pollName">
					<Form.Label>Poll Description</Form.Label>
					<Form.Control
						as="textarea"
						name="pollDescription"
						rows={3}
						placeholder="poll description"
						value={_poll.pollDescription}
					/>
				</Form.Group> 

				<Form.Group className="mb-3" controlId="pollStatus">
				<Form.Label>Poll Actions: &nbsp;&nbsp;</Form.Label>
				<button className="btn btn-outline-danger managePollBtn">DISCARD POLL</button> <button className="btn btn-primary managePollBtn">GO LIVE</button>
				</Form.Group> 

				<Form.Group className="mb-3" controlId="pollSave">
				<button className="btn btn-success managePollBtn" onClick={saveChanges}>Save Changes</button>
				</Form.Group> 

				<Form.Group className="mb-3">
					<Form.Label>
						Pick Starting Date (local time zone)
					</Form.Label>
					<Form.Check
						type="datetime-local"
						id="startDate"
						name="startDate"
					/>
				</Form.Group>
				{/* */}
			</form>

			<DisplayOptions />
			<button onClick={() => navigate("/manage/option/add?pid="+_poll.pollId)}>Add Options</button>

		</div>
	);
};
