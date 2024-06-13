module.exports = function(RED) {
    function IpcPublish(config) {
        RED.nodes.createNode(this, config);
        
        
        // initializations
        const { greengrasscoreipc } = require('aws-iot-device-sdk-v2');        
        var node = this;
        let uuid = process.env.AWS_IOT_THING_NAME;

        let client = greengrasscoreipc.createClient();
        client.connect()
            .then(() => {
                node.status({ fill: "green", shape: "ring", text: "IPC connected" });
            })
            .catch((err) => {
                node.error("Error connecting to IPC: " + err.message);
                node.status({ fill: "red", shape: "ring", text: "Error connecting" });
            });


        // on received message
        node.on('input', async function(msg) {

            // check for valid topic 
            let topic;
            const validTopics = ["input", "event"];
            if (msg.topic && validTopics.includes(msg.topic)) {
                topic = `fbedge/${msg.topic}/${uuid}`;
            } else {
                node.error("Invalid or missing msg.topic. Valid inputs are 'input' and 'event'.", msg);
                return;
            }

            // check valid payload
            if (!msg.payload) {
                node.error("No payload detected");
                return;
            } else {
                if (typeof msg.payload !== "string") {
                    try {
                        msg.payload = JSON.stringify(msg.payload);
                    } catch (e) {
                        node.error("Could not parse msg.payload to string.", msg);
                        return;
                    }
                }
            }

            // attempt to publish
            try {
                const publishToIoTCoreRequest = {
                    topicName: topic,
                    qos: greengrasscoreipc.model.QOS.AT_LEAST_ONCE,
                    payload: msg.payload,
                    payloadFormat: greengrasscoreipc.model.PayloadFormat.UTF8,
                }

                const streamingOperation = client.publishToIoTCore(publishToIoTCoreRequest);
                node.status({ fill: "green", shape: "ring", text: "IPC connected" });
            } catch (err) {
                node.error(err.message, msg);
                this.status({fill:"red",shape:"ring",text:"Error occurred"});
            }

        });


        // on node closed.
        node.on('close', function() {
            client.close();
            node.log("IPC-node ran close funtion.");
        });
    }
    RED.nodes.registerType("ipc-publish", IpcPublish);
}
