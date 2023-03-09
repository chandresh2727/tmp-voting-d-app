import Home from "./components/Home/Home";
import { EthProvider } from "./contexts/EthContext";
// import Intro from "./components/Intro/";
// import Setup from "./components/Setup";
// import Demo from "./components/Demo";
// import Footer from "./components/Footer";

function App() {
  return (
    <EthProvider>
      <div id="App">
        <div className="container">
          <Home/>
          {/* <Intro />
          <hr />
          <Setup />
          <hr />
          <Demo />
          <hr />
          <Footer /> */}
        </div>
      </div>
    </EthProvider>
  );
}

export default App;
