import { useEffect, useState } from "react";
import { getUrlVars } from "../../Handlers/utils";
import Alert from "react-bootstrap/Alert";
import "./Home.css";
import { useNavigate, createSearchParams } from "react-router-dom";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";
import Toast from "react-bootstrap/Toast";
import "../CreatePoll/CreatePoll.css";
import useEth from "../../contexts/EthContext/useEth";
import { FaEdit } from "react-icons/fa";

export const Home = () => {
	const navigate = useNavigate();
	const {
		state: { accounts, contract },
	} = useEth();
	const [pid2, setPid2] = useState("");
	const [polls, setPolls] = useState({ fetched: false, data: {} });
	const varients = ["light", "dark"];

	useEffect(() => {
		const fetchUserPolls = async () => {
			return await contract?.methods
				.getPollsFromUser(accounts[0])
				.call({ from: accounts[0] });
		};
		fetchUserPolls().then((results) => {
			console.log(results);
			setPolls({ fetched: true, data: results });
		});
	}, [accounts, contract]);

	console.log(polls);

	return (
		<div className="Home artificialContainer">
			<div className="fadeOut">
			{getUrlVars()["error"] ? (
				<Toast
					class="lg-toast"
					bg={"danger"}
					autohide={true}
					delay={5000}>
					<Toast.Header closeButton={false}>
						Error
					</Toast.Header>
					<Toast.Body className="text-white">
						{decodeURIComponent(getUrlVars()["msg"])}
					</Toast.Body>
				</Toast>
			) : (
				""
			)}
			</div>
			<div className="participatePoll">
				<Form
					onSubmit={() =>
						navigate({
							pathname: "/vote",
							search: `?${createSearchParams("pid", { pid2 })}`,
						})
					}>
					<Form.Group className="mb-3" controlId="pollid">
						<Form.Label>Participate in Poll</Form.Label>
						<Form.Control
							type="text"
							name="pollid"
							placeholder="pidxxxxxxxxxxxxx"
							required
							value={pid2}
							onChange={(e) => setPid2(e.target.value)}
						/>
					</Form.Group>

					<button>Go!</button>
				</Form>
			</div>

			<div className="mainflex cardDesign">
				<div>
					<button onClick={() => navigate(`/createpoll`)}>
						Create A Poll
					</button>
				</div>
				<div
					style={{
						borderLeft: "1px solid black",
						margin: "0 7.5px",
						alignSelf: "stretch",
					}}></div>

				<div className="editPoll">
					<h1>Your Polls:</h1>
					{!polls.fetched ? (
						<Button
							variant="primary"
							disabled
							className="customBtn">
							<Spinner
								as="span"
								animation="grow"
								size="lg"
								role="status"
								aria-hidden="true"
							/>
							Fetching Polls...
						</Button>
					) : !polls.data || polls.data.length === 0 ? (
						"You have yet to create a poll"
					) : (
						<ListGroup as="ol" numbered>
							{polls.data.map(function (pollsdata, ind) {
								return (
									<ListGroup.Item
										variant={varients[ind % 2]}
										key={ind}
										as="li"
										className="d-flex justify-content-between align-items-start">
										<div>
											<div
												className="fw-bold"
												title={pollsdata.pollName}>
												&nbsp;&nbsp;
												{pollsdata.pollName.length > 31
													? `${pollsdata.pollName.slice(
															0,
															30
													  )}...`
													: pollsdata.pollName}
												&nbsp;&nbsp;
											</div>
										</div>
										<Badge
											bg="primary curpo"
											pill
											title="manage"
											onClick={() =>
												navigate(
													"/manage/poll/modify?pid=" +
														pollsdata.pollId
												)
											}>
											<FaEdit />
										</Badge>
									</ListGroup.Item>
								);
							})}
						</ListGroup>
					)}
				</div>
			</div>
		</div>
	);
};
