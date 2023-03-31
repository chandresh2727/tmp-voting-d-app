export const getUrlVars = () => {
	var vars = {};
	window.location.href.replace(
		/[?&]+([^=&]+)=([^&]*)/gi,
		function (m, key, value) {
			vars[key] = value;
		}
	);
	return vars;
};


export const getRPCErrorMessage = (err) => {
    let commString = "VM Exception while processing transaction: revert "
    return err.toString().split(commString)[1].split("\",")[0]
}