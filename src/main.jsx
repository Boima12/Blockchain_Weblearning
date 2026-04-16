import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import SingleCoursePage from './pages/single-course-page/SingleCoursePage';
import NavBar from './components/nav-bar/NavBar';
import Co_Profile from './pages/profile/Profile';
import Co_CreateCourse from './pages/create-course/CreateCourse';
import Co_EditCourse from './pages/edit-course/EditCourse';
import Co_LearnCourse from './pages/learn-course/LearnCourse';
import Co_Certificate from './pages/certificate/Certificate';

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/Blockchain-Weblearning/courses/:courseId" element={<SingleCoursePage />} />
                <Route
                    path="/profile"
                    element={
                        <>
                            <NavBar />
                            <Co_Profile />
                        </>
                    }
                />
                <Route
                    path="/create-course"
                    element={
                        <>
                            <NavBar />
                            <Co_CreateCourse />
                        </>
                    }
                />
                <Route
                    path="/edit-course/:courseId"
                    element={
                        <>
                            <NavBar />
                            <Co_EditCourse />
                        </>
                    }
                />
                <Route
                    path="/learn-course/:courseId"
                    element={
                        <>
                            <NavBar />
                            <Co_LearnCourse />
                        </>
                    }
                />
                <Route
                    path="/certificate/:courseId"
                    element={
                        <>
                            <NavBar />
                            <Co_Certificate />
                        </>
                    }
                />
                <Route
                    path="/Blockchain-Weblearning/profile"
                    element={
                        <>
                            <NavBar />
                            <Co_Profile />
                        </>
                    }
                />
                <Route
                    path="/Blockchain-Weblearning/create-course"
                    element={
                        <>
                            <NavBar />
                            <Co_CreateCourse />
                        </>
                    }
                />
                <Route
                    path="/Blockchain-Weblearning/edit-course/:courseId"
                    element={
                        <>
                            <NavBar />
                            <Co_EditCourse />
                        </>
                    }
                />
                <Route
                    path="/Blockchain-Weblearning/learn-course/:courseId"
                    element={
                        <>
                            <NavBar />
                            <Co_LearnCourse />
                        </>
                    }
                />
                <Route
                    path="/Blockchain-Weblearning/certificate/:courseId"
                    element={
                        <>
                            <NavBar />
                            <Co_Certificate />
                        </>
                    }
                />
            </Routes>
        </BrowserRouter>
    </StrictMode>,
);
