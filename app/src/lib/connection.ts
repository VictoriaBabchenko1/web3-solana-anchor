import { clusterApiUrl, Connection } from "@solana/web3.js";
import { CLUSTER } from "./constants";

export const endpoint = clusterApiUrl(CLUSTER);
export const connection = new Connection(endpoint);