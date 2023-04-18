import {CreatePoll} from "./components/CreatePoll/CreatePoll";
import { EthProvider } from "./contexts/EthContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {ManagePoll} from "./components/ManagePoll/ManagePoll";
import {Home} from "./components/Home/Home";
import {Navbar} from "./components/Navbar/Navbar";
// import {RedirectToHome} from "./components/RedirectToHome/RedirectToHome";
import { AddOption } from "./components/AddOption/AddOption"; 
import { ViewOption } from "./components/ViewOption/ViewOption";
import { RemoveOption } from "./components/RemoveOption/RemoveOption";
// import Intro from "./components/Intro/";
// import Setup from "./components/Setup";
// import Demo from "./components/Demo";
// import Footer from "./components/Footer";
function App() {
	return (
		<EthProvider>
			<div id="App">
				<div className="container">
					<Router>
						<Navbar />
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/manage" >
								{/* <Route index element={<RedirectToHome/>} /> */}
								<Route path="option" >
									{/* <Route index element={<RedirectToHome/>} /> */}
									<Route path="add" element={<AddOption />} />
									<Route path="view" element={<ViewOption />} />
									<Route path="remove" element={<RemoveOption />} />
								</Route>
								<Route path="/manage/poll/modify" element={<ManagePoll />} />
							</Route>
							<Route path="/createpoll" element={<CreatePoll />} />
						</Routes>
					</Router>
				</div>
			</div>
		</EthProvider>
	);
}

export default App;
