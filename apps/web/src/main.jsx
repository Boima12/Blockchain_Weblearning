import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "./web3/wagmiConfig";

import App from "./App.jsx";
import SingleCoursePage from './pages/single-course-page/SingleCoursePage';
import NavBar from './components/nav-bar/NavBar';
import Co_Profile from './pages/profile/Profile';
import Co_CreateCourse from './pages/create-course/CreateCourse';
import Co_EditCourse from './pages/edit-course/EditCourse';
import Co_LearnCourse from './pages/learn-course/LearnCourse';
import Co_Certificate from './pages/certificate/Certificate';
import Co_BuyCourse from './pages/buy-course/BuyCourse';
import Co_Login from './pages/login/Login';
import IpfsDebug from './pages/ipfs-debug/IpfsDebug';

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
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
                            path="/buy-course/:courseId"
                            element={
                                <>
                                    <NavBar />
                                    <Co_BuyCourse />
                                </>
                            }
                        />
                        <Route
                            path="/login"
                            element={
                                <>
                                    <NavBar />
                                    <Co_Login />
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
                            path="/Blockchain-Weblearning/login"
                            element={
                                <>
                                    <NavBar />
                                    <Co_Login />
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
                        <Route
                            path="/Blockchain-Weblearning/buy-course/:courseId"
                            element={
                                <>
                                    <NavBar />
                                    <Co_BuyCourse />
                                </>
                            }
                        />
                        <Route
                            path="/ipfs-debug"
                            element={
                                <>
                                    <NavBar />
                                    <IpfsDebug />
                                </>
                            }
                        />
                        <Route
                            path="/Blockchain-Weblearning/ipfs-debug"
                            element={
                                <>
                                    <NavBar />
                                    <IpfsDebug />
                                </>
                            }
                        />
                    </Routes>
                </BrowserRouter>
            </QueryClientProvider>
        </WagmiProvider>
    </StrictMode>,
);
