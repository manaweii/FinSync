import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./components/Login";
import SignupPage from "./components/Signup";
import HomePage from "./components/LandingPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/Login" element={<LoginPage />} />
        <Route path="/Signup" element={<SignupPage />} />

        {/* Example home (can be protected later) */}
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
