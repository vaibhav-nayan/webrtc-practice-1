import React, { useEffect, useRef, useState } from 'react'

const Sender = () => {

    const [socket, setSocket] = useState<WebSocket | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080')

        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: "sender"
            }))
            setSocket(socket)
        }
    }, [])

    async function startSendingVideo () {
        console.log("function called")
        if (!socket) {
            return
        }

        //create an offer
        const pc = new RTCPeerConnection()
        
        pc.onnegotiationneeded = async () => {
            console.log("onnegotiationneeded called")
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.send(JSON.stringify({
                type: "createOffer",
                sdp: pc.localDescription
            }))
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(JSON.stringify({
                    type: "iceCandidate",
                    candidate: event.candidate
                }))
            }
        }

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if(message.type === "createAnswer") {
                await pc.setRemoteDescription(message.answer);
            } else if (message.type === "iceCandidate") {
                pc.addIceCandidate(message.candidate);
            }
        }

        const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
        const videoTrack = stream.getVideoTracks()[0];
        pc.addTrack(videoTrack);
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // No need to call play(); autoPlay + muted will handle it
        }
    }

    return (
        <div>
            <button onClick={startSendingVideo}>Send video</button>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', maxWidth: 1200, transform: "rotateY(180deg)" }} />
        </div>
    )
}

export default Sender