import { getUrlVars } from '../../Handlers/utils'
import './ShareButton.css'
import {RiFileCopy2Line} from 'react-icons/ri'
import Overlay from 'react-bootstrap/Overlay';
import Tooltip from 'react-bootstrap/Tooltip';
import { useState , useRef, useEffect} from 'react';

export const ShareButton = () => {
    const [showCopyTT, setShowCopyTT] = useState(false)
    const target = useRef(null);
    const [shareDimentions, setShareDimentions] = useState({
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    })

useEffect(() => {
    if(document && document.querySelector && document.querySelector(".shareBtnIcon")) {
        let {top, left, bottom, right} =  document.querySelector(".shareBtnIcon").getBoundingClientRect()
        if (top && left && right){
        setShareDimentions((prevState) => ({
            ...prevState,
            top, left, bottom, right
        }))}
    }
}, [])
// alert()
    return (<span className='shareBtn'>
 <Overlay target={target.current}  show={showCopyTT} placement="right" >
        {(props) => (
          <Tooltip id="overlay-example" {...props} style={{zIndex: "999", position: "absolute", top: shareDimentions.top+10, left: shareDimentions.left+50, right: shareDimentions.right, width: "fit-content", fontSize: "1.5rem"}}>
            Copied!
          </Tooltip>
        )}
      </Overlay>
<RiFileCopy2Line className='shareBtnIcon' title="copy link" onClick={() => setTimeout(() => {
   setShowCopyTT(true)
   navigator.clipboard.writeText(`${window.location.origin}/vote?pid=${getUrlVars()['pid']}`).then(function() {

setTimeout(() => {
    setShowCopyTT(false)
}, 2500);
    }, function(err) {
        console.error('Async: Could not copy text: ', err);
      })
},500)}/>
    </span>)
}