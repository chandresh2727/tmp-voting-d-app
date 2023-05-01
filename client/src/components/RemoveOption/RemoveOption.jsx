import { useCallback, useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import Web3 from "web3";
import { getUrlVars, getRPCErrorMessage } from "../../Handlers/utils";
import { useNavigate } from "react-router-dom";
import "./RemoveOption.css";

export const RemoveOption = () => {
	const web3 = new Web3(Web3.givenProvider || "ws://localhost:7545");
	const {
		state: { accounts, contract },
	} = useEth();
	const navigate = useNavigate();
	const MetamaskErrorHandler = useCallback(
		(e) => {
			let commString =
				"VM Exception while processing transaction: revert ";
			if (e.toString().includes(commString)) {
				let emsg = getRPCErrorMessage(e);
				console.log("----ManagePoll.jsx----", emsg);
				navigate("/?error=1&msg=" + emsg);
			} else {
				// alert("unknown error occured");
                navigate(
                    `/manage/poll/modify?pid=${
                        getUrlVars()["pid"]
                    }&error=1&msg=deletion failed`
                );  
				console.log("addoptionjsx ->getpolldetails().catch()");
				throw new Error(e);
			}
		},
		[navigate]
	)
    let [clicked, setClicked] = useState(false)
    const performDeletion = async () => {
        const gasFee = async (hash,r,s,v) => {
            
            let value = await contract?.methods
            .removePollOptions(
                getUrlVars()["pid"],
                getUrlVars()["oid"],
                hash,
                r,
                s,
                v
            )
            .send({ from: accounts[0] })
            .catch((e) => {
                console.log(e);
                MetamaskErrorHandler(e);
            });
            let a = await value.events["evRemovePollOptions"].returnValues["deleted"];
            if (a) {
                return navigate(
                    `/manage/poll/modify?pid=${
                        getUrlVars()["pid"]
                    }&success=true&msg=deletion successfull`
                );
            } else {
                return navigate(
                    `/manage/poll/modify?pid=${
                        getUrlVars()["pid"]
                    }&error=1&msg=deletion failed`
                );
            }
        }
        const executeRemoval = async () => {
           
            if(!(accounts && contract && contract.methods && contract.methods.removePollOptions)) return;
            setClicked(true)

            let removeReq = {
                oid: getUrlVars()["oid"],
                pid: getUrlVars()["pid"],
                action: "remove",
            };
            let hash = web3.utils.sha3(JSON.stringify(removeReq));
			
			let signature = await web3.eth.personal
				.sign(hash, accounts[0])
				.catch((e) => {
                    MetamaskErrorHandler(e)
					console.log(e)
			})
            ;
			let r = signature.slice(0, 66);
			let s = "0x" + signature.slice(66, 130);
			let v = parseInt(signature.slice(130, 132), 16);
            console.log(gasFee(hash,r,s,v))
        }
        executeRemoval()
    }	
    return (
		<>
			{clicked ? <><h1 className="loading">Processing Request To Remove Option</h1>
			<br />
			<br />
			<h3 className="d-flex w-100 justify-content-center">
				You will be redirected automatically
			</h3></>:<span className="w-100 dblock"> <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><h1>Confirm deletion by pressing the button below!</h1> <button className="btn managePollBtn2 btn-danger" onClick={(e) => {
                e.preventDefault()
                performDeletion()
                           setClicked(true)

            }}>DELETE OPTION</button></span>}
		</>
	);
};
