
welcomeMessage = "Hello, Welcome to employee verification portal. How are you doing today ?"

tools = [
    {
        "type": "function",
        "function": {
            "name": "captureName",
            "description": "This function will be called once name of the employee is captured.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Name of the employee",
                    },
                },
                "required": ["name"],
                "additionalProperties": false,
            },
            "strict": true,
        }
    },
    {
        "type": "function",
        "function": {
            "name": "captureExperience",
            "description": "This function will be called once years of experience of the employee is captured.",
            "parameters": {
                "type": "object",
                "properties": {
                    "yoe": {
                        "type": "string",
                        "description": "Years of Experience of the employee",
                    },
                },
                "required": ["yoe"],
                "additionalProperties": false,
            },
            "strict": true,
        }
    },
    {
        "type": "function",
        "function": {
            "name": "captureDOB",
            "description": "This function will be called once date of birth of the employee is captured.",
            "parameters": {
                "type": "object",
                "properties": {
                    "dob": {
                        "type": "string",
                        "description": "Date of the birth of the employee in DD/MM/YYYY format. Don't mention anything about format to user.",
                    },
                },
                "required": ["dob"],
                "additionalProperties": false,
            },
            "strict": true,
        }
    },
    {
        "type": "function",
        "function": {
            "name": "fetchEmployeeCompany",
            "description": "This function will fetch the employees avaible current company details from the database",
            "parameters": {
                "type": "object",
                "properties": {
                    "employee_id": {
                        "type": "string",
                        "description": "Employee ID of user passed in system prompt after hitting submit button.",
                    },
                },
                "required": ["employee_id"],
                "additionalProperties": false,
            },
            "strict": true,
        }
    },
    {
        "type": "function",
        "function": {
            "name": "fetchCompanies",
            "description": "This function will fetch other companies available from the database",
            "parameters": {
                "type": "object",
                "properties": {
                    "employee_id": {
                        "type": "string",
                        "description": "Employee ID of user passed in system prompt after hitting submit button.",
                    },
                },
                "required": ["employee_id"],
                "additionalProperties": false,
            },
            "strict": true,
        }
    },
];

llmContextA = {
    "model": "gpt-4.1-mini",
    "messages": [
        {
            "role": "system",
            "content": `You are a helpful voice assistant interacting with the user and helping him/her to fill the employee verification form.
            
            Call the functions 'captureName', 'captureExperience' and 'captureDOB' function to complete the employee verification process.
            `
        }
    ],
    "tools": tools
}

url = "https://api.openai.com/v1/chat/completions";
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer "
}


// Tool Calls..
function updateName(args) {
    document.getElementById("name").value = args.name;
    return {"status": true}
}

function updateYOE(args) {
    document.getElementById("yoe").value = args.yoe;
    return {"status": true}
}

function updateDOB(args) {
    document.getElementById("dob").value = args.dob;
    return {
        "status": true,
        "next_step": "Ask user to verify the filled details and hit submit button."
    }
}

function fetchEmployeeCompany(args) {
    document.getElementById("company").value = "Jio Private Limited"
    return {
        "status": true,
        "employee_company": "Jio Pvt. Ltd.",
        "next_step": "Ask user to confirm the company details. If not correct then call fetchCompanies function and tell other companies else thank user."
    }
}

function fetchCompanies(args) {
    return {
        "status": true,
        "companies": [
            "Reliance",
            "Amazon",
            "Browser Stack",
            "Flipkart",
            "WhatsApp"
        ]
    }
}
// End..

function insertChat(role, message) {
    var ele = document.querySelector("#agent-chatbox .chatbox-body");
    ele.insertAdjacentHTML("beforeend", `<div class="message ` + role + `">
    <p>` + message + `</p>
  </div>`);

  ele.scrollTop = ele.scrollHeight
}

function addAgentMessage(message) {
    llmContextA.messages.push({
        "role": "assistant",
        "content": message
    })

    insertChat("agent", message);
}

function addUserMessage(message) {
    llmContextA.messages.push({
        "role": "user",
        "content": message
    })

    insertChat("user", message);
}


async function sendMessage(message) {

    if (message) {
        addUserMessage(message)
    }

    try {
        console.log(JSON.stringify(llmContextA))
        const response = await fetch(url, {
            method: 'POST', // Specify the HTTP method as POST
            headers: headers,
            body: JSON.stringify(llmContextA) // Convert the JavaScript object to a JSON string
        });
    
        if (!response.ok) {
            console.log(response)
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const responseData = await response.json(); // Parse the JSON response from the server
        console.log('Success:', responseData);

        if (responseData.choices[0].finish_reason == "tool_calls") {

            llmContextA.messages.push({
                "role": "assistant",
                "tool_calls": responseData.choices[0].message.tool_calls
            })

            for (var i=0; i<responseData.choices[0].message.tool_calls.length; i++) {

                toolName = responseData.choices[0].message.tool_calls[i].function.name
                toolArgs = JSON.parse(responseData.choices[0].message.tool_calls[i].function.arguments)

                console.log(toolName)
                console.log(toolArgs)

                if (toolName == "captureName") {
                    resp = updateName(toolArgs)
                } else if (toolName == "captureExperience") {
                    resp = updateYOE(toolArgs)
                } else if (toolName == "captureDOB") {
                    resp = updateDOB(toolArgs)
                } else if (toolName == "fetchEmployeeCompany") {
                    resp = fetchEmployeeCompany(toolArgs)
                } else if (toolName == "fetchCompanies") {
                    resp = fetchCompanies(toolArgs)
                }

                llmContextA.messages.push({
                    "role": "tool",
                    "tool_call_id": responseData.choices[0].message.tool_calls[i].id,
                    "name": toolName,
                    "content": JSON.stringify(resp)
                })
            }
            sendMessage()
            return;

        }

        runTTS(responseData.choices[0].message.content);
        addAgentMessage(responseData.choices[0].message.content)

        return responseData;
    } catch (error) {
        console.error('Error:', error);
        throw error; // Re-throw the error for further handling if needed
    }
}


function onLoad() {
    console.log("Hello World!!");

    window.speechSynthesis.getVoices()

    SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

    recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event) => {
        // console.log(event.results)
        const message = event.results[event.results.length-1][0].transcript;
        console.log(`Result received: ${message}.`);
        console.log(`Confidence: ${event.results[0][0].confidence}`);

        await sendMessage(message);
    };

    recognition.onspeechend = () => {
        console.log("Speech Recognition Stopped..")
        recognition.stop();
    };

}


function runTTS(message) {

    recognition.stop();

    let utterance = new SpeechSynthesisUtterance(message);
    // utterance.voice = speechSynthesis.getVoices()[40]
    speechSynthesis.speak(utterance);
    utterance.onend = function (event) {
        console.log("TTS speaking ended..")
        recognition.start();
    }
}


function btnClick() {
    console.log("Button Clicked..")
    document.getElementById("agent-chatbox").style.display = "block";
    recognition.start();
    runTTS(welcomeMessage);
    addAgentMessage(welcomeMessage);
}


function completeVerification() {
    document.getElementById("verification-div").style.display = "none";
    document.getElementById("div-title").innerText = "Company Details"
    document.getElementById("post-verification-div").style.display = "flex";

    llmContextA.messages.push({
        "role": "system",
        "content": `User clicked the submit button and is verified. Employee ID is 4879.
        
        Greet user by name.

        Call fetchEmployeeCompany function and confirm the company name of user.`
    })
    sendMessage();
}

window.onload = onLoad;
