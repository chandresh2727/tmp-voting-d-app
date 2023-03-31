import Form from "react-bootstrap/Form";
import useEth from "../../contexts/EthContext/useEth";
import {useEffect} from 'react';
import { getUrlVars } from "../../Handlers/utils";

export const DisplayOptions = () => {
    const {
		state: { accounts, contract, artifact },
	} = useEth();

    useEffect(() => {
		const fetchUserDetails = async () => {
			return await contract?.methods.fetchPollOptions(getUrlVars()['pid']).call({ from: accounts[0] });
		};
		fetchUserDetails().then((details) => {
			console.log(details)
		})
	}, [accounts, contract]);

    return <div>
        
    </div>
}