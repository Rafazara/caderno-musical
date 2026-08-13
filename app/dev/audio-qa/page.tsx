import { notFound } from "next/navigation";
import { AudioQa } from "./tool";
export default function Page(){if(process.env.NODE_ENV!=='development')notFound();return <AudioQa/>;}
