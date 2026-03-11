import React from "react";
import StreamFeed from "../components/StreamFeed.tsx";
import NepalClock from "../components/NepalClock.tsx";

const Stream = () => {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Classroom Stream</h1>
          <p className="text-slate-500 mt-1">Stay updated with the latest activity from all your classes</p>
        </div>
        <NepalClock />
      </header>
      <StreamFeed />
    </div>
  );
};

export default Stream;
