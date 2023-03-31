import { useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import Web3 from "web3";
import Form from "react-bootstrap/Form";
// import Alert from "react-bootstrap/Alert";
import "./CreatePoll.css";
import {AddressImport} from "./AddressImport";
import {DAOTokenImport} from "./DAOTokenImport";
import {
	textAreaIterator,
	excelIterator,
	jsonIterator,
} from "../../Handlers/iteratorHandler";
import { useNavigate } from "react-router-dom";
// var ethers = require('ethers');

export const CreatePoll = () => {
	const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
	const [pType, setPType] = useState(0);
	const [customStartDate, setCustomStartDate] = useState(false);
	const [startDate, setStartDate] = useState({
		localdate: "00/00/0000, 00:00:00 AM",
		utcdate: "",
		epoch: 0,
	});
	const [customEndDate, setCustomEndDate] = useState(false);
	const [endDate, setEndDate] = useState({
		localdate: "00/00/0000, 00:00:00 AM",
		utcdate: "",
		epoch: 0,
	});
	const {
		state: { accounts, contract },
	} = useEth();

	const navigate = useNavigate();

	const pollCreateHandle = async (e) => {
		e.preventDefault();
		const formData = new FormData(e.target),
			formDataObj = Object.fromEntries(formData.entries());

		// if the poll has the start date
		if (formDataObj.startDate) {
			formDataObj.startDate = startDate.utcdate;
			formDataObj.startDateEpoch = startDate.epoch;
			// current time + 30 min in milliseconds
			if (Date.now() + 1800000 > formDataObj.startDateEpoch * 1000) {
				console.log(formDataObj);
				return alert(
					"Start date should atleast be 30 Minutes in Future"
				);
			}
		}

		// if the poll has the expiry date
		if (formDataObj.endDate) {
			formDataObj.endDate = endDate.utcdate;
			formDataObj.endDateEpoch = endDate.epoch;
		}

		// if the poll has an expiry date without the start date
		if (!formDataObj.startDate && formDataObj.endDate) {
			if (Date.now() > formDataObj.endDateEpoch * 1000) {
				return alert("End date should be the future date or time");
			}
		}

		// if the poll has both start and expiry date and the starting date/time + 30 min is greater than the selected end time
		if (
			formDataObj.startDate &&
			formDataObj.endDate &&
			formDataObj.startDateEpoch * 1000 + 1800000 >
				formDataObj.endDateEpoch * 1000
		) {
			return alert("End date should start after the Start date");
		}

		let poll = {
			pollId: "abc",
			pollName: formDataObj.pollName,
			pollDescription: formDataObj.pollDescription,
			pollType: 0,
			pollStatus: 0,
			hostId: "hst",
			walletAddress: accounts[0],
			addressList: ["0x0000000000000000000000000000000000000000"],
			tokenContractAddress: "0x0000000000000000000000000000000000000000",
			tokenAmount: 0,
			options: ["tmp"],
		};

		let pollTime = {
			pollId: "abc",
			customStartDate: false,
			customEndDate: false,
			pollStartDate: 0,
			pollEndDate: 0,
		};


		const iteratorResHandler = (res, cb) => {
			if (res.length === 0) {
				window.alert("0 Address found, Please choose another file");
				throw new Error("Please choose another file");
				// todo remove the current selected file
			} else {
				formDataObj.addressList = res;
				cb(false);
			}
		};

		const textAreaIteratorHandler = (res) => {
			if (res.length === 0) {
				window.alert("0 Valid Address found");
				throw new Error("Please choose another file");
			} else {
				formDataObj.addressList = res;
			}
		};

		if (formDataObj.addressListFile) {
			let _excelFileTypes = [
				"text/csv",
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				"application/vnd.ms-excel",
				".csv",
			];
			if (_excelFileTypes.includes(formDataObj.addressListFile.type))
				excelIterator(formDataObj.addressListFile, iteratorResHandler);
			else jsonIterator(formDataObj.addressListFile, iteratorResHandler);
			delete formDataObj["addressListFile"];
		} else if (formDataObj.addressList && !formDataObj.addressListFile) {
			textAreaIterator(formDataObj.addressList, textAreaIteratorHandler);
		}

		let nonce = await web3.eth.getTransactionCount(accounts[0]);


		window.alert(typeof formDataObj.pollType);

		if (formDataObj.pollType === "1") {
			alert("type 1");
			poll.addressList = formDataObj.addressList;
		}

		if (formDataObj.pollType === "2") {
			alert("type 2");
			poll.addressList = formDataObj.addressList;
			poll.tokenContractAddress = formDataObj.tokenAddress;
			poll.tokenAmount = formDataObj.tokenAmount;
		}

		if (customStartDate) {
			pollTime.customStartDate = true;
			pollTime.pollStartDate = startDate.epoch;
		}

		if (customEndDate) {
			pollTime.customEndDate = true;
			pollTime.pollEndDate = endDate.epoch;
		}
		alert(pollTime.pollStartDate )

		let hash = web3.utils.sha3(JSON.stringify(poll));
		let signature = await web3.eth.personal.sign(hash, accounts[0]);
		let r = signature.slice(0, 66);
		let s = "0x" + signature.slice(66, 130);
		let v = parseInt(signature.slice(130, 132), 16);
		console.log(poll);
		console.log("signature" + signature);
		console.log("hash" + hash);
		console.log(`r = ${r} | s = ${s} | v = ${v}`);
		// address[] must always contain string of address
		// address (single instance) can either be string  or plain
		// struct parameters should be passed using [] as tuples
		// enum should be sent as an integer or big number

		// convert obj values to array
		let _poll = Object.keys(poll).map((key) => poll[key]);
		let _pollTime = Object.keys(pollTime).map((key) => pollTime[key]);
		console.log(_pollTime)
		console.table(_poll, _pollTime, accounts[0], nonce, hash, signature);
		let value = await contract.methods
			.createPoll(
				_poll,
				_pollTime,
				accounts[0],
				nonce,
				hash,
				signature,
				r,
				s,
				v
			)
			.send({ from: accounts[0] });
		let a = await value.events["evCreatePoll"].returnValues["_pollId"];
		if (a.slice(0, 3) === "pid") {
			navigate(`/manage/poll/modify?pid=${a}`);
		}
	};

	return (
		<Form onSubmit={pollCreateHandle}>
			<Form.Group className="mb-3" controlId="pollName">
				<Form.Label>Poll Name</Form.Label>
				<Form.Control
					type="text"
					name="pollName"
					placeholder="poll name"
					required
				/>
				{/* <Form.Text className="text-muted">
            We'll never share your email with anyone else.
            </Form.Text> */}
			</Form.Group>

			<Form.Group className="mb-3" controlId="pollDesc">
				<Form.Label>Poll Description</Form.Label>
				<Form.Control
					as="textarea"
					name="pollDescription"
					rows={3}
					placeholder="poll description"
					required
				/>
			</Form.Group>

			<Form.Group className="mb-3">
				<Form.Label>
					Poll Type{" "}
					<span
						id="tooltip-help"
						data-toggle="tooltip"
						data-placement="bottom"
						title="	i) Private - host can upload .json, excel or even mannually add list of ethereum account addresses which are eligible to vote.
ii) Private (Metered) | Stakeholder Voting - Only voters with minimum amount of specific DAO tokens can vote or Voters with special attributes.  
iii)Public - Anyone can vote just by connecting their account">
						?
					</span>
				</Form.Label>
				<Form.Select
					name="pollType"
					onChange={(e) => setPType(Number(e.target.value))}
					required>
					<option value={0}>PUBLIC</option>
					<option value={1}>PRIVATE</option>
					<option value={2}>METERED</option>
				</Form.Select>
			</Form.Group>

			<Form.Group className="mb-3">
				<Form.Label>Poll Staus</Form.Label>
				<Form.Select name="pollStatus" disabled>
					<option value={0}>DRAFT</option>
				</Form.Select>
			</Form.Group>
			{pType === 1 || pType === 2 ? <AddressImport /> : ""}

			{pType === 2 ? <DAOTokenImport /> : ""}

			<Form.Check
				type="switch"
				id="customStart"
				name="customStart"
				label="Custom Start Date ?"
				checked={customStartDate}
				onChange={(e) => setCustomStartDate(!customStartDate)}
			/>
			{customStartDate ? (
				<Form.Group className="mb-3">
					<Form.Label>
						Pick Starting Date (local time zone)
					</Form.Label>
					<Form.Check
						type="datetime-local"
						id="startDate"
						name="startDate"
						onChange={(date) => {
							const selectedDate = new Date(date.target.value);
							const utcString = selectedDate.toUTCString();
							const localString = selectedDate.toLocaleString();
							alert((selectedDate.getTime() -
							selectedDate.getMilliseconds()) /
						1000)
							setStartDate({
								localdate: localString,
								utcdate: utcString,
								epoch:
									(selectedDate.getTime() -
										selectedDate.getMilliseconds()) /
									1000,
							});
							//   alert(utcString);
						}}
						label={startDate.localdate}
						required
					/>
				</Form.Group>
			) : (
				""
			)}

			<Form.Check
				type="switch"
				id="customEnd"
				name="customEnd"
				label="Custom End Date ?"
				checked={customEndDate}
				onChange={(e) => setCustomEndDate(!customEndDate)}
			/>
			{customEndDate ? (
				<Form.Group className="mb-3">
					<Form.Label>Pick Expire Date (local time zone)</Form.Label>
					<Form.Check
						type="datetime-local"
						id="endDate"
						name="endDate"
						onChange={(date) => {
							const selectedDate = new Date(date.target.value);
							const utcString = selectedDate.toUTCString();
							const localString = selectedDate.toLocaleString();
							setEndDate({
								localdate: localString,
								utcdate: utcString,
								epoch:
									(selectedDate.getTime() -
										selectedDate.getMilliseconds()) /
									1000,
							});
						}}
						label={endDate.localdate}
						required
					/>
				</Form.Group>
			) : (
				""
			)}

			<button className="submit">Create Poll</button>
		</Form>
	);
};
