import Form from "react-bootstrap/Form";
import useEth from "../../contexts/EthContext/useEth";
import { useEffect, useState } from "react";
import { getUrlVars, getRPCErrorMessage } from "../../Handlers/utils";
import "./DisplayOption.css";
import { HiEye, HiTrash } from "react-icons/hi";
import {RiAddCircleLine} from "react-icons/ri"
import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import { useNavigate } from "react-router-dom";

export const DisplayOptions = (pstatus) => {
	console.log(window.location.href, "display optio jsx")
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
					navigate("/?error=1&msg=" + emsg)
				} else {
					console.log(
						"displayoption.jsx ->fetchPollOptions().catch()"
					);
					alert("displayoption.jsx ->fetchPollOptions().catch()");
					throw new Error(e);
				}
			});
	}, [accounts, contract, navigate]);

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
					{/* {alert([pstatus.pstatus])} */}
					
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
								<span className="iconGroup">	<Badge
										bg="primary curpo"
										pill
										title="view"
										onClick={() =>{
											console.log(window.location.href, "clicked here at display option")
											navigate(`/manage/option/view?oid=${pollOptionsdata.optionId}&pid=${getUrlVars()['pid']}`)
										}
										}>
										<HiEye />
									</Badge>
									<Badge
										bg="danger curpo"
										pill
										title="remove"
										onClick={() =>
											navigate(`/manage/option/remove?oid=${pollOptionsdata.optionId}&pid=${getUrlVars()['pid']}`)
										}>
										<HiTrash />
										</Badge></span>
								</ListGroup.Item>
							);
						})}
					</ListGroup></>

				)}
			</Form.Group>
		</div>
	);
};
