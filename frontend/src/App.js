import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ApplyPage from "./pages/ApplyPage";
import DashboardPage from "./pages/DashboardPage";
import RankingPage from "./pages/RankingPage";
import CreateJobPage from "./pages/CreateJobPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ProfilePage from "./pages/ProfilePage";
import InterviewsPage from "./pages/InterviewsPage";
import AnalysisPage from "./pages/AnalysisPage";
import PrepareQuestions from "./pages/PrepareQuestions";
import JobInterviewDetails from "./pages/JobInterviewDetails";
import StartInterview from "./pages/StartInterviewPage";
import CandidateDetails from "./pages/CandidateDetails";

import Layout from "./components/Layout";






function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/apply/:jobId" element={<ApplyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
         <Route path="/start/:jobId" element={<StartInterview />} />

        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/ranking/:jobId" element={<RankingPage />} />
              <Route path="/create-job" element={<CreateJobPage />} />
              <Route path="/interviews" element={<InterviewsPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/prepare-questions/:jobId" element={<PrepareQuestions />} />
               <Route path="/interview-details/:jobId" element={<JobInterviewDetails />} />
                <Route path="/candidate/:candidateId" element={<CandidateDetails />} />


            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
