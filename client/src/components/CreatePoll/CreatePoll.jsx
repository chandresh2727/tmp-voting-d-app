import { useEffect, useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import Web3 from "web3";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
// import Alert from "react-bootstrap/Alert";
import "./CreatePoll.css";
import { AddressImport } from "./AddressImport";
import { DAOTokenImport } from "./DAOTokenImport";
import {
	textAreaIterator,
	excelIterator,
	jsonIterator,
} from "../../Handlers/iteratorHandler";
import { useNavigate } from "react-router-dom";

import { toIsoString } from "../../Handlers/utils";

import moment from "moment-timezone";

export const CreatePoll = () => {
	const web3 = new Web3(Web3.givenProvider || "ws://localhost:7545");
	const add30MiN = 1000 * 60 * 30;
	const [pType, setPType] = useState(0);
	const [idle, setIdle] = useState(true)
	const [btnText, setBtnText] = useState("Create Poll")
	const [customDateObj, setCustomDateObj] = useState({
		startDate: {
			minStartDate: toIsoString(new Date(moment().toLocaleString())),
			custom: false,
			epoch: moment().valueOf(),
			utcdate: "",
			localdate: new Date().toLocaleString(), // new Date().toLocaleString()
		},
		endDate: {
			minEndDate: toIsoString(
				new Date(moment(Date.now() + add30MiN).toLocaleString())
			).slice(0, -9),
			custom: false,
			epoch: moment(Date.now() + add30MiN).valueOf(),
			utcdate: "",
			localdate: new Date(Date.now() + add30MiN).toLocaleString(),
		},
	});
	const startDateErrorList = [
		undefined,
		"Start Date Should Be A Future Date, Check the hour and minute section",
	];
	const endDateErrorList = [
		undefined,
		"End Date Should Be Atleast 30 Minutes In The Future",
		"End Date Should Atleast be 30 Minutes In Future than Start Date",
	];
	const [startDateError, setStartDateError] = useState({
		error: false,
		message: 0,
	});
	const [endDateError, setEndDateError] = useState({
		error: false,
		message: 0,
	});

	// const [customStartDate, setCustomStartDate] = useState(false);
	// const [startDate, setStartDate] = useState({
	// 	localdate: "00/00/0000, 00:00:00 AM",
	// 	utcdate: "",
	// 	epoch: 0,
	// });
	// const [customEndDate, setCustomEndDate] = useState(false);
	// const [endDate, setEndDate] = useState({
	// 	localdate: "00/00/0000, 00:00:00 AM",
	// 	utcdate: "",
	// 	epoch: 0,
	// });
	const {
		state: { accounts, contract },
	} = useEth();
	// const [endDateMinBoundary, setEndDateMinBoundary] = useState(toIsoString(new Date(moment(Date.now()+  1800000).toLocaleString())).slice(0, -9))
	const navigate = useNavigate();
	// let dateC = new Date(Date.now())
	// const minStartDate = `${dateC.getFullYear()}-${(('0'+(dateC.getMonth()+1)).slice(-2))}-${(('0'+dateC.getDate()).slice(-2))}T${(('0'+dateC.getHours()).slice(-2))}:${(('0'+dateC.getMinutes()).slice(-2))}`

	useEffect(() => {
		if (!customDateObj.startDate.custom) {
			setCustomDateObj((obj) => ({
				...obj,
				endDate: {
					...obj.endDate,
					minEndDate: toIsoString(
						new Date(moment(Date.now() + add30MiN).toLocaleString())
					).slice(0, -9),
				},
			}));
		}
	}, [customDateObj.startDate.custom, add30MiN]);

	// alert(endDateMinBoundary)

	const pollCreateHandle = async (e) => {
		const revertButton = () => {
			document.querySelector(
				"#App > div > form > button"
			).disabled = false;
			document.querySelector(
				"#App > div > form > button"
			).style.backgroundColor = "#08d";
			setBtnText("Create Poll")
			setIdle(true)
		};
		try {
			e.preventDefault();
			document.querySelector(
				"#App > div > form > button"
			).disabled = true;
			document.querySelector(
				"#App > div > form > button"
			).style.backgroundColor = "grey";
			setBtnText("processing request...")
			setIdle(false)
			//

			const formData = new FormData(e.target);
			const formDataObj = Object.fromEntries(formData.entries());

			// if the poll has the start date
			if (formDataObj.startDate) {
				formDataObj.startDate = customDateObj.startDate.utcdate;
				formDataObj.startDateEpoch = customDateObj.startDate.epoch;
				// current time + 30 min in milliseconds
				// alert(Date.now() + 1800000, formDataObj.startDateEpoch)
				// if (Date.now() + 1800000 > formDataObj.startDateEpoch) {
				// 	return alert(
				// 		"Start date should be a Future Date"
				// 	);
				// }
			}

			// if the poll has the expiry date
			if (formDataObj.endDate) {
				formDataObj.endDate = customDateObj.endDate.utcdate;
				formDataObj.endDateEpoch = customDateObj.endDate.epoch;
			}

			// if the poll has an expiry date without the start date
			if (!formDataObj.startDate && formDataObj.endDate) {
				if (Date.now() > formDataObj.endDateEpoch) {
					revertButton();
					return alert("End date should be the future date or time");
				}
			}

			// if the poll has both start and expiry date and the starting date/time + 30 min is greater than the selected end time
			if (
				formDataObj.startDate &&
				formDataObj.endDate &&
				formDataObj.startDateEpoch + 1800000 > formDataObj.endDateEpoch
			) {
				revertButton();
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
				tokenContractAddress:
					"0x0000000000000000000000000000000000000000",
				tokenAmount: 0.0,
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
					revertButton();
					throw new Error("Please choose another file");
					// todo remove the current selected file
				} else {
					formDataObj.addressList = res;
					// cb(false);
				}
			};

			const textAreaIteratorHandler = (res) => {
				if (res.length === 0) {
					window.alert("0 Valid Address found");
					revertButton();
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
					excelIterator(
						formDataObj.addressListFile,
						iteratorResHandler
					);
				else
					jsonIterator(
						formDataObj.addressListFile,
						iteratorResHandler
					);
				delete formDataObj["addressListFile"];
			} else if (
				formDataObj.addressList &&
				!formDataObj.addressListFile
			) {
				textAreaIterator(
					formDataObj.addressList,
					textAreaIteratorHandler
				);
			}

			let nonce = await web3.eth.getTransactionCount(accounts[0]);

			if (formDataObj.pollType === "1") {
				poll.addressList = formDataObj.addressList;
			}

			if (formDataObj.pollType === "2") {
				poll.addressList = formDataObj.addressList;
				poll.tokenContractAddress = formDataObj.tokenAddress;
				poll.tokenAmount = formDataObj.tokenAmount;
			}

			if (customDateObj.startDate.custom) {
				pollTime.customStartDate = true;
				pollTime.pollStartDate = customDateObj.startDate.epoch;
			}

			if (customDateObj.endDate.custom) {
				pollTime.customEndDate = true;
				pollTime.pollEndDate = customDateObj.endDate.epoch;
			}

			let hash = web3.utils.sha3(JSON.stringify(poll));
			
			let signature = await web3.eth.personal
				.sign(hash, accounts[0])
				.catch((e) => {
					console.log(e)
					revertButton();
				});
			let r = signature.slice(0, 66);
			let s = "0x" + signature.slice(66, 130);
			let v = parseInt(signature.slice(130, 132), 16);
			setTimeout(()=>setBtnText("verifying and redirecting (this might take a while)"),7500)
			// address[] must always contain string of address
			// address (single instance) can either be string  or plain
			// struct parameters should be passed using [] as tuples
			// enum should be sent as an integer or big number

			// convert obj values to array
			let _poll = Object.keys(poll).map((key) => poll[key]);
			let _pollTime = Object.keys(pollTime).map((key) => pollTime[key]);
			console.table(
				_poll,
				_pollTime,
				accounts[0],
				nonce,
				hash,
				signature
			);
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
				.send({ from: accounts[0] })
				.catch((e) => {
					revertButton();
					console.log(e)
					alert("user cancelled the request", "hh");
				});
			setBtnText("verifying and redirecting...")
			let a = await value.events["evCreatePoll"].returnValues["_pollId"];
			revertButton();
			if (a.slice(0, 3) === "pid") {
				navigate(`/manage/poll/modify?pid=${a}`);
			}
		} catch (e) {
			revertButton();
			console.log(e)
			alert("user cancelled the request", "gg");
			// alert("user cancelled the request");
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
				className="datbtn"
				checked={customDateObj.startDate.custom}
				onChange={(e) =>
					setCustomDateObj((obj) => ({
						...obj,
						startDate: {
							...obj.startDate,
							custom: !obj.startDate.custom,
						},
					}))
				}
			/>

			{/* set datepicker value to current time + 30, disable for current time + 30 */}
			{customDateObj.startDate.custom ? (
				<Form.Group className="mb-3">
					{startDateError.error ? (
						<div className="errorMsg">
							{startDateErrorList[startDateError.message]}
						</div>
					) : (
						""
					)}
					<Form.Label>
						Pick Starting Date ({moment.tz.guess()}{" "}
						{moment.tz(moment.tz.guess()).zoneAbbr()})
					</Form.Label>

					<Form.Check
						type="datetime-local"
		
						id="startDate"
						min={toIsoString(
							new Date(moment().toLocaleString())
						).slice(0, -9)}
						name="startDate"
						onChange={(date) => {
							const selectedDate = new Date(date.target.value);
							const utcString = selectedDate.toUTCString();
							const epoch = moment(selectedDate).valueOf();

							setCustomDateObj((obj) => {
								let newEndDateISO = toIsoString(
									new Date(obj.endDate.epoch)
								).slice(0, -9);
								let newEDO = {
									...obj.endDate,
								};

								if (obj.endDate.custom) {
									if (
										obj.startDate.epoch + add30MiN >
										obj.endDate.epoch
									) {
										newEndDateISO = toIsoString(
											new Date(
												moment(
													epoch + add30MiN
												).toLocaleString()
											)
										).slice(0, -9);
										newEDO.minEndDate = newEndDateISO;
										newEDO.localdate = new Date(
											newEndDateISO
										).toLocaleString();
										newEDO.epoch = moment(
											epoch + add30MiN
										).valueOf();
										setEndDateError({
											error: true,
											message: 2,
										});
									}

									if (
										obj.startDate.epoch + add30MiN <
										obj.endDate.epoch
									) {
										if (
											endDateError.error &&
											endDateError.message === 2
										) {
											setEndDateError({
												error: false,
												message: 0,
											});
										}
									}
								}

								let retObj = {
									endDate: newEDO,
									startDate: {
										...obj.startDate,
										epoch,
										minStartDate: toIsoString(
											new Date(epoch)
										),
										utcdate: utcString,
										localdate:
											selectedDate.toLocaleString(),
									},
								};
								return retObj;
							});

							if (epoch < moment().valueOf()) {
								setStartDateError({ error: true, message: 1 });
							} else {
								setStartDateError({ error: false, message: 0 });
							}
						}}
						label={
							customDateObj.startDate.localdate ===
							"00/00/0000, 00:00:00 AM"
								? new Date(
										moment
											.utc(
												toIsoString(
													new Date(
														moment().toLocaleString()
													)
												)
											)
											.toISOString()
								  ).toLocaleString()
								: customDateObj.startDate.localdate
						}
						value={
							customDateObj.startDate.minStartDate.slice(0, -9)
						}
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
				className="datbtn" 
				label="Custom End Date ?"
				checked={customDateObj.endDate.custom}
				onChange={(e) =>
					setCustomDateObj((obj) => ({
						...obj,
						endDate: {
							...obj.endDate,
							custom: !obj.endDate.custom,
						},
					}))
				}
			/>
			{customDateObj.endDate.custom ? (
				<Form.Group className="mb-3">
					{endDateError.error ? (
						<div className="errorMsg">
							{endDateErrorList[endDateError.message]}
						</div>
					) : (
						""
					)}
					<Form.Label>
						Pick Expire Date ({moment.tz.guess()}{" "}
						{moment.tz(moment.tz.guess()).zoneAbbr()}){" "}
					</Form.Label>
					<Form.Check
						type="datetime-local"
						id="endDate"
						min={toIsoString(
							new Date(
								customDateObj.startDate.custom
									? customDateObj.startDate.epoch + add30MiN
									: Date.now() + add30MiN
							)
						).slice(0, -9)}
						name="endDate"
						onChange={(date) => {
							// alert(endDateMinBoundary)
							const selectedDate = new Date(date.target.value);
							const utcString = selectedDate.toUTCString();
							const epoch = moment(selectedDate).valueOf();
							if (
								customDateObj.startDate.custom &&
								epoch <
									moment(
										customDateObj.startDate.epoch
									).valueOf()
							) {
								setEndDateError({ error: true, message: 2 });
							} else if (
								epoch < moment(Date.now() + add30MiN).valueOf()
							) {
								setEndDateError({ error: true, message: 1 });
							} else if (endDateError.error) {
								setEndDateError({ error: false, message: 0 });
							}

							setCustomDateObj((obj) => ({
								...obj,
								endDate: {
									...obj.endDate,
									epoch,
									utcdate: utcString,
									localdate: selectedDate.toLocaleString(),
									selectedDate: toIsoString(new Date(epoch)),
								},
							}));
						}}
						// label={endDate.localdate}
						label={
							customDateObj.endDate.localdate ===
							"00/00/0000, 00:00:00 AM"
								? new Date(
										Date.now() + add30MiN
								  ).toLocaleString()
								: new Date(
										(() => {
											if (
												customDateObj.startDate.custom
											) {
												return toIsoString(
													new Date(
														customDateObj.endDate.epoch
													)
												).slice(0, -9);
											} else {
												if (
													customDateObj.endDate
														.selectedDate
												) {
													return customDateObj.endDate.selectedDate.slice(
														0,
														-9
													);
												} else {
													return toIsoString(
														new Date(
															moment(
																new Date(
																	Date.now() +
																		add30MiN
																)
															).toLocaleString()
														)
													).slice(0, -9);
												}
											}
										})()
								  ).toLocaleString()
						}
						value={(() => {
							if (customDateObj.startDate.custom) {
								return toIsoString(
									new Date(customDateObj.endDate.epoch)
								).slice(0, -9);
							} else {
								if (customDateObj.endDate.selectedDate) {
									return customDateObj.endDate.selectedDate.slice(
										0,
										-9
									);
								} else {
									return toIsoString(
										new Date(
											moment(
												new Date(Date.now() + add30MiN)
											).toLocaleString()
										)
									).slice(0, -9);
								}
							}
						})()}
						required
					/>
				</Form.Group>
			) : (
				""
			)}

			<button className="submit">
				{!idle ? (
					<span>
						<Spinner
							as="span"
							animation="grow"
							size="lg"
							role="status"
							aria-hidden="true"
						/>
						&nbsp;
					</span>
				) : (
					''
				)}{btnText}
			</button>
		</Form>
	);
};
