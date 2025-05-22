/* @refresh reload */
import { Router, Route } from "@solidjs/router";
import { render } from "solid-js/web";
import "./App.css";
import App from "./App.tsx";
import Campaign from "./pages/Campaign.tsx";

const root = document.getElementById("root");

render(
  () => (
    <Router>
      <Route path="/" component={App} />
      <Route path="/c/:pubkey/:dTag" component={Campaign} />
    </Router>
  ),
  root!
);
