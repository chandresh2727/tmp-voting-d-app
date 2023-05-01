import {CreatePoll} from "./components/CreatePoll/CreatePoll";
import { EthProvider } from "./contexts/EthContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {ManagePoll} from "./components/ManagePoll/ManagePoll";
import {Home} from "./components/Home/Home";
import {Navbar} from "./components/Navbar/Navbar";
import { AddOption } from "./components/AddOption/AddOption";
import { ViewOption } from "./components/ViewOption/ViewOption";
import { RemoveOption } from "./components/RemoveOption/RemoveOption";
import { Vote } from "./components/Vote/Vote";
import { Results } from "./components/Results/Results";

function App() {
	return (
		<EthProvider>
			<div id="App">
				<div className="container">
					<Router>
						<Navbar />
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/vote" element={<Vote/>} />
							<Route path="/createpoll" element={<CreatePoll />} />
							<Route path="/results" element={<Results />}/>
							<Route path="/manage" >
								<Route path="option" >
									<Route path="add" element={<AddOption />} />
									<Route path="view" element={<ViewOption />} />
									<Route path="remove" element={<RemoveOption />} />
								</Route>
								<Route path="poll" >
									<Route path="modify" element={<ManagePoll />} />
								</Route>
							</Route>
						</Routes>
					</Router>
				</div>
			</div>
		</EthProvider>
	);
}

export default App;
