import { player } from "../data/user_data.js";

export let user = null;

const form = document.getElementById("userdata");

form.addEventListener("submit", (event) => {
    event.preventDefault(); // 送信による再読み込みを止める

    const username = document.getElementById("myInput").value.trim();
    if (!username) return;

    user = new player(username);

    document.getElementById("username-display").textContent =
        `${user.username}さん、ようこそ！`;
     console.log(user.username); // "Yamada"
});