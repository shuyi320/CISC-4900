"use client";

import { io } from "socket.io-client";

export const socket = io("ws://localhost:3001", { withCredentials: true });;