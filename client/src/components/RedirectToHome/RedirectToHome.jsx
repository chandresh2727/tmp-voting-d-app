import { useNavigate } from "react-router-dom";

export const RedirectToHome = () => {
	const navigate = useNavigate();
    navigate("/")
    return <div></div>
}