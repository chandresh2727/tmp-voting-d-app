import { useState, useEffect, useCallback  } from "react";
import useEth from "../../contexts/EthContext/useEth";
import Web3 from "web3";
import Form from "react-bootstrap/Form";
import { getUrlVars, getRPCErrorMessage } from "../../Handlers/utils";
import { useNavigate } from "react-router-dom";
import {IoMdArrowRoundBack, IoMdTrash} from 'react-icons/io'
import './ViewOption.css'

export const ViewOption = () => {
	const web3 = new Web3(Web3.givenProvider || "ws://localhost:7545");
	const navigate = useNavigate();
	const {
		state: { accounts, contract },
	} = useEth();
	const [showRemoveOpt, setShowRemoveOpt] = useState(true)
    console.log(window.location.href, "view option jsx")

	const [optionDetails, setOptionDetails] = useState({
		pollId: getUrlVars()["pid"],
		optionId: "demo",
		optionName: "",
		optionDescription: "",
	})

    const MetamaskErrorHandler = useCallback((e) => {
        let commString =
            "VM Exception while processing transaction: revert ";
        if (e.toString().includes(commString)) {
            let emsg = getRPCErrorMessage(e);
            console.log("----ManagePoll.jsx----", emsg);
            navigate("/?error=1&msg=" + emsg);
        } else {
            // alert("unknown error occured");
            console.log("addoptionjsx ->getpolldetails().catch()");
            throw new Error(e);
        }
    }, [navigate])
    useEffect(() => {
        const getOptionDetails = async () => {
            return await contract?.methods.fetchOptionById(getUrlVars()['pid'],getUrlVars()['oid']).call({from: accounts[0]})
        }
        getOptionDetails().then((option) => {
            setOptionDetails({...optionDetails, ...option})
        }).catch((e) => MetamaskErrorHandler(e))
    }, [accounts, contract,MetamaskErrorHandler])
	// const [isMetered, ]	


	useEffect(() => {
		// alert("hi")
		const getPollDetails = async () => {
			return await contract?.methods
				.getPollDetails(getUrlVars()["pid"], Math.floor(Date.now()/1000))
				.call({ from: accounts[0] });
		};

		getPollDetails().then(d => {
			if (showRemoveOpt && (d.pollStatus !== "0")) {
				setShowRemoveOpt(false)
			}
		}).catch((e) => MetamaskErrorHandler(e))
	}, [contract, accounts, navigate, MetamaskErrorHandler])

	return (
		<Form>
			{/* option title */}
			<Form.Group className="mb-3" controlId="optionTitle">
				<Form.Label>Option Title</Form.Label>
				<Form.Control
					type="text"
					name="optionTitle"
					placeholder="Option Title"
					value={optionDetails.optionName}
					disabled
				/>
			</Form.Group>


			{/* optionDescription */}
			<Form.Group className="mb-3" controlId="optionDescription">
				<Form.Label>Option Description</Form.Label>
				<Form.Control
					as="textarea"
					name="optionDescription"
					rows={3}
                    style={optionDetails.optionDescription === "" ? {color: "red"}: {}}
					placeholder="Brief description for the option"
					value={optionDetails.optionDescription === "" ? "--no description provided--" :optionDetails.optionDescription}
					disabled
				/>
			</Form.Group>
			{/* Submit poll */}
			<div className="d-flex">
            <button className="submit filterEffect" onClick={() => {
                console.log(window.location.href, "clicked view option")
                navigate(`/manage/poll/modify?pid=${getUrlVars()["pid"]}`)}}> <IoMdArrowRoundBack/> &nbsp; {"GO BACK".toUpperCase()}</button>
            &nbsp;&nbsp;{showRemoveOpt ? <button style={{background: "crimson"}} className="submit filterEffect"onClick={() =>
											navigate(`/manage/option/remove?oid=${getUrlVars()['oid']}&pid=${getUrlVars()['pid']}`)
										}> <IoMdTrash/> &nbsp; {"REMOVE".toUpperCase()}</button> : <></>}
            </div>
		</Form>
	);
};
// };
