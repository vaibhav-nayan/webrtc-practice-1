import { useEffect, useRef } from 'react'

const Receiver = () => {

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080')

        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: "receiver"
            }))
        }

        const pc = new RTCPeerConnection();
        pc.ontrack = (event) => {
            console.log(event)
            const stream = new MediaStream([event.track]);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // No need to call play(); autoPlay + muted will handle it
            }
        }

        socket.onmessage = async (event) =>{
            // console.log(event.data)
            const message = JSON.parse(event.data);
            if (message.type === "createOffer") {
                
                
                await pc.setRemoteDescription(message.sdp);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.send(JSON.stringify({
                            type: "iceCandidate",
                            candidate: event.candidate
                        }))
                    }
                }

                socket.send(JSON.stringify({
                    type: "createAnswer",
                    sdp : answer
                }))

            } else if (message.type === "iceCandidate") {
                pc.addIceCandidate(message.candidate);
            }
        }
    }, [])
    
    

    return (
        <div>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', maxWidth: 1200, transform: "rotateY(180deg)" }} />
        </div>
        
    )
}

export default Receiver