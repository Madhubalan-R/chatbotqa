import { BrowserRouter, Routes, Route } from "react-router-dom";
import Phonenumber from "./components/Phonenumber";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Phonenumber />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
