import {WebSocketServer, WebSocket} from "ws";

const wss = new WebSocketServer({ port: 8080 });


let senderSocket: null | WebSocket = null;
let receiverSocket: null | WebSocket = null;

wss.on('connection', function connection(ws) {
    ws.on('error', console.error);

    ws.on('message', function message(data: any) {
        const message = JSON.parse(data);

        if (message.type === "sender"){
            senderSocket = ws;
            console.log("Sender set")
        } else if (message.type === "receiver"){
            receiverSocket = ws;
            console.log("receiver set")
        } else if (message.type === "createOffer") {
            receiverSocket?.send(JSON.stringify({
                type: "createOffer",
                sdp : message.sdp
            }))
            console.log("offer sent")
        } else if (message.type === "createAnswer") {
            senderSocket?.send(JSON.stringify({
                type: "createAnswer",
                answer: message.sdp
            }))
            console.log("answer sent")
        } else if (message.type === "iceCandidate") {
            if (senderSocket === ws) {
                receiverSocket?.send(JSON.stringify({
                    type: "iceCandidate",
                    candidate: message.candidate
                }))
                console.log("ice candidate sent to sender")
            }
            else if (receiverSocket === ws) {
                senderSocket?.send(JSON.stringify({
                    type: "iceCandidate",
                    candidate: message.candidate
                }))
                console.log("ice candidate sent to receiver")
            }
        }
    });
});