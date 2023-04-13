import Form from "react-bootstrap/Form";
import useEth from "../../contexts/EthContext/useEth";
import { useEffect, useState } from "react";
import { getUrlVars, getRPCErrorMessage } from "../../Handlers/utils";
import "./DisplayOption.css";
import { FaEdit } from "react-icons/fa";
import {RiAddCircleLine} from "react-icons/ri"
import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import { useNavigate, } from "react-router-dom";

export const DisplayOptions = (pstatus) => {
	const navigate = useNavigate();
	const {
		state: { accounts, contract },
	} = useEth();
	const [pollOptions, setPollOptions] = useState({
		fetched: false,
		data: {},
	});
	const varients = ["dark", "light"];
	useEffect(() => {
		const fetchPollOptions = async () => {
			return await contract?.methods
				.fetchPollOptions(getUrlVars()["pid"])
				.call({ from: accounts[0] });
		};
		fetchPollOptions()
			.then((details) => {
				console.log(details);
				setPollOptions({ fetched: true, data: details });
			})
			.catch((e) => {
				let commString =
					"VM Exception while processing transaction: revert ";
				if (e.toString().includes(commString)) {
					let emsg = getRPCErrorMessage(e);
					console.log("----ManagePoll.jsx----", emsg);
					window.location.href = "/?error=1&msg=" + emsg;
				} else {
					console.log(
						"displayoption.jsx ->fetchPollOptions().catch()"
					);
					alert("displayoption.jsx ->fetchPollOptions().catch()");
					throw new Error(e);
				}
			});
	}, [accounts, contract]);

	return (
		<div>
			<Form.Group className="mb-3" controlId="pollOptions">
				{!pollOptions.fetched ? (
					<button variant="primary" disabled>
						<span>
							<Spinner
								as="span"
								animation="grow"
								size="lg"
								role="status"
								aria-hidden="true"
							/>
							&nbsp; Fetching Options...
						</span>
					</button>
				) : (
					<>
					{["0","1"].includes(pstatus) ? <button className="btn btn-secondary managePollBtn"
							onClick={() =>
								navigate(
									"/manage/option/add?pid=" + getUrlVars()["pid"]
								)
							}>
							 <RiAddCircleLine  color="white" /> {"Create a new option".toUpperCase()}
						</button> : "You Cannot Add Options After Poll End"}
					<ListGroup as="ol" numbered>
						{pollOptions?.data?.map(function (pollOptionsdata, ind) {
							return (
								<ListGroup.Item
									variant={varients[ind % 2]}
									key={ind}
									as="li"
									className="d-flex justify-content-between align-items-start">
									<div>
										<div
											className="fw-bold"
											title={pollOptionsdata.optionName}>
											&nbsp;&nbsp;
											{pollOptionsdata.optionName.length >
											31
												? `${pollOptionsdata.optionName.slice(
														0,
														30
												  )}...`
												: pollOptionsdata.optionName}
											&nbsp;&nbsp;
										</div>
									</div>
									<Badge
										bg="primary curpo"
										pill
										title="manage"
										onClick={() =>
											navigate(
												"/manage/option/modify?pid=" +
													pollOptionsdata.optionId
											)
										}>
										<FaEdit />
									</Badge>
								</ListGroup.Item>
							);
						})}
					</ListGroup></>

				)}
			</Form.Group>
		</div>
	);
};
