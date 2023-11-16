const express = require("express");
const axios = require("axios");
const app = express();

const inputData = require("./input-data/fcc.js");
const PORT = 55000;
const HOST = "localhost";
const bpmnBaseUrl = "http://localhost:22030";

app.get("/", async (req, res) => {
  res.send(`App Started on ${HOST}`);
});

app.get("/init", async (req, res) => {
  const { module: inputXml } = inputData;

  // /process-definitions
  const { data: processDefinition } = await axios.post(
    `${bpmnBaseUrl}/process-definitions`,
    {
      name: "process_1",
      xml: JSON.stringify(inputXml),
      version: 1,
      description: "string",
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const result = await createThousandRequest(processDefinition.definitionId);
  if (result) {
    setTimeout(()=>{
        executeRequest();
    },10000)
  } else {
    console.log("not working as expected");
  }
});

async function createThousandRequest(definitionId) {
  try {
    return new Promise(async (resolve, reject) => {
      let i;
      for (i = 0; i < 10; i++) {
        processInstance = await axios.post(
          `${bpmnBaseUrl}/process-instances`,
          {
            definitionId: definitionId,
            input: {
              ticketId: "123" + i.toString(),
            },
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      console.log('1 req ...', i)

      if (i == 10) {
        return resolve({ status: 200, message: "success" });
      } else {
        return reject({ status: 500, message: "lag gai waat" });
      }
    });
  } catch (error) {
    console.log(error);
  }
}

async function executeRequest() {
  console.log('executing request ...')
  const processInstances = await axios.get(`${bpmnBaseUrl}/process-instances`);
  const totalProcess = JSON.parse(JSON.stringify(processInstances["data"]));

  const totalProcessInstances = totalProcess.length;

  const data = processInstances["data"];

  let i

  for (i = 0; i < totalProcessInstances; i++) {
    const processId = totalProcess[i].processId;
    processInstanceExe = await axios.post(
      `${bpmnBaseUrl}/process-instances/${processId}/execute`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  if (i == 10) {
    setTimeout(() => {
        recurse();        
    }, 10000);
  } else {
    console.log("error");
  }
}

async function recurse() {
  const processInstances = await axios.get(`${bpmnBaseUrl}/process-instances`);
  const dataCopy = JSON.parse(JSON.stringify(processInstances["data"]));
  const totalProcess = dataCopy.filter(
    (data) =>  data.waitFor
  );

  console.log(totalProcess);

  const totalProcessInstances = totalProcess.length;

  const data = processInstances["data"];

  for (let i = 0; i < totalProcessInstances; i++) {
    const processId = totalProcess[i].processId;

    await sendSignal(totalProcess[i].waitFor[0].id, processId);
  }
  if (totalProcessInstances) {
    recurse();
  } else {
    return true;
  }
}

const sendSignal = (activityId, processId) => {
  try {
    console.log('sending signal ...')
    return new Promise(async (resolve, reject) => {
      const res = await axios.post(
        `${bpmnBaseUrl}/process-instances/${processId}/signal`,
        {
          activityId: activityId,
          data: { order_received: "1" },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      if (res) {
        return resolve(res);
      } else {
        return reject("not working as expected");
      }
    });
  } catch (error) {
    console.log(error);
  }
};

app.listen(PORT, "0.0.0.0", () => {
  console.info(`:: Server started on port ${PORT} ::`);
});
