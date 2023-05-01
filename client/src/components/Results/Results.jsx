import {useState, useEffect} from 'react'
import useEth from "../../contexts/EthContext/useEth";
import { getUrlVars } from "../../Handlers/utils";
import './Results.css';
import {ResponsivePie} from "@nivo/pie";

export const Results = () => {
    const {
            state: { accounts, contract },
        } = useEth();
    const [pollResults, setPollResults] = useState({
        fetched: false, 
        data:[{
            optionId: "0000000",
            optionName: "loading",
            voteCount: 70
        }, {
            optionId: "0000001",
            optionName: "loading",
            voteCount: 30
        }]
    })
    // const 

    useEffect(() => {
       setInterval(() => {
        const getPollResults = async () => {
            return await contract?.methods
                .getPollResults(getUrlVars()["pid"], Math.floor(Date.now() / 1000))
                .call({ from: accounts[0] });
        };
        
        getPollResults().then((resultsData) => {
            if (resultsData.fetched) return
            
            setPollResults(prevState => ({
                ...prevState,
                fetched: true,
                data: resultsData.map((v) => {
                    return {
                        label: v.optionName,
                        id: v.optionName,
                        oid: v.optionId,
                        value:  v.voteCount
                    }
                })
            }))
        }).catch((e) => console.error(e))
       }, 2000);
            const getPollResults = async () => {
                return await contract?.methods
                    .getPollResults(getUrlVars()["pid"], Math.floor(Date.now() / 1000))
                    .call({ from: accounts[0] });
            };
            
            getPollResults().then((resultsData) => {
                if (resultsData.fetched) return
                
                setPollResults(prevState => ({
                    ...prevState,
                    fetched: true,
                    data: resultsData.map((v) => {
                        return {
                            label: v.optionName,
                            id: v.optionName,
                            oid: v.optionId,
                            value:  v.voteCount
                        }
                    })
                }))
            }).catch((e) => console.error(e))
    },[contract, accounts])


    return (<div style={{height: "auto", display: "flex", justifyContent: "center"}}> 
        <div style={{background: "transparent", padding: "2%", borderRadius: "14px", height: "65vh", width: "100%"}}>
        <ResponsivePie 
        data={pollResults.data}
        margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
        innerRadius={0.5}
        padAngle={0.7}
        cornerRadius={3}
        activeOuterRadiusOffset={8}
        borderWidth={1}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor="white"
        arcLinkLabelsThickness={2}
        arcLabelsSkipAngle={10}
        legends={[
            {
                anchor: 'bottom',
                direction: 'row',
                justify: false,
                translateX: 0,
                translateY: 56,
                itemsSpacing: 0,
                itemWidth: 100,
                itemHeight: 18,
                itemTextColor: 'white',
                itemDirection: 'left-to-right',
                itemOpacity: 1,
                symbolSize: 18,
                symbolShape: 'circle',
                effects: [
                    {
                        on: 'hover',
                        style: {
                            itemTextColor: '#000'
                        }
                    }
                ]
            },
            {
                anchor: 'top-left',
                direction: 'column',
                justify: false,
                translateX: 0,
                translateY: 0,
                itemWidth: 100,
                itemHeight: 20,
                itemsSpacing: 0,
                symbolSize: 20,
                itemTextColor: 'white',
                symbolShape: 'diamond',
                itemDirection: 'left-to-right'
            }
        ]}
    />
        </div>
    </div>)
}