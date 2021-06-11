import React from "react";

import ToolBar from "./components/ToolBar";
import CodeArea from "./components/CodeArea";

import './App.css';

const App = () => {
    return (
        <div className="App">
            <ToolBar/>
            <CodeArea/>
        </div>
    );
}

export default App;
