import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import SignIn from "./pages/SignIn.jsx";
import CreateAccount from "./pages/CreateAccount.jsx";
import EditAccount from "./pages/EditAccount.jsx";
import Home from "./pages/Home.jsx";
import Leagues from "./pages/Leagues.jsx";
import CreateLeague from "./pages/CreateLeague.jsx";
import DraftRules from "./pages/DraftRules.jsx";
import DraftTeams from "./pages/DraftTeams.jsx";
import DraftPlan from "./pages/DraftPlan.jsx";
import DraftDraft from "./pages/DraftDraft.jsx";
import DraftView from "./pages/DraftView.jsx";
import DraftPlayers from "./pages/DraftPlayers.jsx";
import CreateLeague from "./pages/CreateLeague.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/edit-account" element={<EditAccount />} />
          <Route path="/home" element={<Home />} />
          <Route path="/leagues" element={<Leagues />} />
          <Route path="/create-league" element={<CreateLeague />} />
          <Route path="/draft/:id/rules" element={<DraftRules />} />
          <Route path="/draft/:id/teams" element={<DraftTeams />} />
          <Route path="/draft/:id/plan" element={<DraftPlan />} />
          <Route path="/draft/:id/draft" element={<DraftDraft />} />
          <Route path="/draft/:id/view" element={<DraftView />} />
          <Route path="/draft/:id/players" element={<DraftPlayers />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
